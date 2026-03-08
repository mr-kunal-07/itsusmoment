import { useState } from "react";
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
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export type BillingPlan = "pro_monthly" | "pro_yearly";

export function useRazorpayCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const checkout = async (plan: BillingPlan) => {
    if (!user) return;
    setLoading(true);

    try {
      // Load Razorpay script dynamically
      await loadRazorpayScript();

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create order via edge function
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const orderRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/razorpay-create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "CoupleVault",
          description: orderData.description,
          order_id: orderData.order_id,
          prefill: { email: user.email },
          theme: { color: "#d4b896" },
          modal: {
            ondismiss: () => {
              setLoading(false);
              resolve();
            },
          },
          handler: async (response: RazorpayResponse) => {
            try {
              // Verify payment via edge function
              const verifyRes = await fetch(
                `https://${projectId}.supabase.co/functions/v1/razorpay-verify-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    plan,
                  }),
                }
              );

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || verifyData.error) {
                throw new Error(verifyData.error || "Payment verification failed");
              }

              await queryClient.invalidateQueries({ queryKey: ["subscription"] });
              toast({
                title: "🎉 Welcome to Pro!",
                description: "Your subscription is now active. Enjoy unlimited uploads and voice messages!",
              });
              resolve();
            } catch (err) {
              reject(err);
            } finally {
              setLoading(false);
            }
          },
        });
        rzp.open();
      });
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return { checkout, loading };
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}
