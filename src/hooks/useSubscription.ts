import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Plan = "free" | "pro";

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
  });
}

export function usePlan(): Plan {
  const { data } = useSubscription();
  return (data?.plan as Plan) ?? "free";
}

// Feature gating helpers
export const FREE_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const PRO_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB
export const FREE_MONTHLY_UPLOAD_LIMIT = 50;

export function canUseVoiceMessages(plan: Plan) {
  return plan === "pro";
}

export function getStorageLimit(plan: Plan) {
  return plan === "pro" ? PRO_STORAGE_LIMIT_BYTES : FREE_STORAGE_LIMIT_BYTES;
}

export function formatStorageLimit(plan: Plan) {
  return plan === "pro" ? "50 GB" : "5 GB";
}
