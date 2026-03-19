import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  recurring?: boolean;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  config?: {
    display: {
      blocks: Record<string, { name: string; instruments: Array<{ method: string; flows?: string[] }> }>;
      sequence: string[];
      preferences: { show_default_blocks: boolean };
    };
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}

export type BillingPlan = "dating" | "soulmate";

/* ── Module-level constants ──────────────────────────────────────── */
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const EDGE_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1`;
const RAZORPAY_URL = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_TIMEOUT_MS = 10_000;

/* ── Script loader (singleton, concurrency-safe) ─────────────────── */
let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_URL;
    script.async = true;

    const timer = setTimeout(() => {
      script.remove();
      scriptPromise = null;
      reject(new Error("Razorpay SDK timed out"));
    }, SCRIPT_TIMEOUT_MS);

    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay SDK"));
    };

    document.body.appendChild(script);
  });

  return scriptPromise;
}

/* ── Edge function helper ────────────────────────────────────────── */
async function callEdge<T>(
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${EDGE_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? `${path} failed`);
  return data as T;
}

/* ── Hook ────────────────────────────────────────────────────────── */
export function useRazorpayCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const settledRef = useRef(false);

  const checkout = async (plan: BillingPlan): Promise<void> => {
    if (!user || loading) return;

    settledRef.current = false;
    setLoading(true);

    try {
      await loadRazorpayScript();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Backend should create a Razorpay subscription (not a one-time order)
      // and return subscription_id + key_id + amount for first payment
      const orderData = await callEdge<{
        key_id: string;
        subscription_id: string;
        amount: number;
        currency: string;
        description: string;
      }>("razorpay-create-subscription", session.access_token, { plan });

      await new Promise<void>((resolve, reject) => {
        const settle = (fn: () => void) => {
          if (settledRef.current) return;
          settledRef.current = true;
          setLoading(false);
          fn();
        };

        const rzp = new window.Razorpay({
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "CoupleVault",
          description: orderData.description,
          // Pass subscription_id instead of order_id for recurring
          order_id: orderData.subscription_id,
          recurring: true,
          prefill: { email: user.email },
          theme: { color: "#d4b896" },

          // Force UPI as the only payment method shown
          // and prefer the "collect" flow which deep-links to UPI apps
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [
                    // "collect" = user enters UPI ID (GPay, PhonePe etc.)
                    // "intent"  = deep-link directly opens UPI app
                    { method: "upi", flows: ["intent", "collect", "qr"] },
                  ],
                },
              },
              sequence: ["block.upi"],
              preferences: { show_default_blocks: false },
            },
          },

          modal: {
            ondismiss: () => settle(resolve),
          },

          handler: async (response: RazorpayResponse) => {
            try {
              await callEdge(
                "razorpay-verify-payment",
                session.access_token,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  plan,
                }
              );

              await queryClient.invalidateQueries({ queryKey: ["subscription"] });

              toast({
                title: `💕 ${plan === "soulmate" ? "Soulmate" : "Dating"} plan activated!`,
                description: "UPI AutoPay is set up. You won't need to pay manually again.",
              });

              settle(resolve);
            } catch (err) {
              settle(() => reject(err));
            }
          },
        });

        rzp.open();
      });

    } catch (err) {
      if (!settledRef.current) {
        setLoading(false);
        settledRef.current = true;
      }
      console.error("Checkout error:", err);
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return { checkout, loading };
}