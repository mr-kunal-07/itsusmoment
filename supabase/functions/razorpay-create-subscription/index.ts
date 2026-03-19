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
    subscription_id?: string;
    order_id?: string;
    recurring?: boolean;
    handler: (response: RazorpayResponse) => void;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
    config?: {
        display: {
            blocks: Record<string, {
                name: string;
                instruments: Array<{ method: string; flows?: string[] }>;
            }>;
            sequence: string[];
            preferences: { show_default_blocks: boolean };
        };
    };
}

interface RazorpayInstance {
    open: () => void;
}

interface RazorpayResponse {
    razorpay_order_id?: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    razorpay_subscription_id?: string;
}

export type BillingPlan = "dating" | "soulmate";

const RAZORPAY_URL = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_TIMEOUT_MS = 10_000;

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

// Use supabase.functions.invoke instead of raw fetch
// This automatically uses the correct project URL + auth
async function callEdge<T>(
    fnName: string,
    body: Record<string, unknown>
): Promise<T> {
    const { data, error } = await supabase.functions.invoke<T>(fnName, {
        body,
    });
    if (error) throw new Error(error.message ?? `${fnName} failed`);
    if (!data) throw new Error(`${fnName} returned no data`);
    return data;
}

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

            const orderData = await callEdge<{
                key_id: string;
                subscription_id: string;
                amount: number;
                currency: string;
                description: string;
            }>("razorpay-create-subscription", { plan });

            console.log("Subscription created:", orderData);

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
                    subscription_id: orderData.subscription_id,
                    recurring: true,
                    prefill: { email: user.email },
                    theme: { color: "#d4b896" },
                    config: {
                        display: {
                            blocks: {
                                upi: {
                                    name: "Pay via UPI",
                                    instruments: [
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
                            console.log("Payment response:", response);

                            await callEdge("razorpay-verify-payment", {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_order_id: response.razorpay_order_id,
                                plan,
                            });

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