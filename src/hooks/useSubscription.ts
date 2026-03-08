import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Plan = "single" | "dating" | "soulmate";

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
  const raw: string = (data?.plan as string) ?? "single";
  // Map legacy "free" → "single", "pro" → "soulmate"
  if (raw === "free") return "single";
  if (raw === "pro") return "soulmate";
  return raw as Plan;
}

// Storage limits
export const PLAN_STORAGE: Record<Plan, number> = {
  single:   1  * 1024 * 1024 * 1024, // 1 GB
  dating:   5  * 1024 * 1024 * 1024, // 5 GB
  soulmate: 50 * 1024 * 1024 * 1024, // 50 GB (unlimited-ish)
};

export const PLAN_UPLOAD_LIMIT: Record<Plan, number | null> = {
  single:   10,   // 10 uploads / month
  dating:   50,   // 50 uploads / month
  soulmate: null, // unlimited
};

export const PLAN_STORAGE_LABEL: Record<Plan, string> = {
  single:   "1 GB",
  dating:   "5 GB",
  soulmate: "50 GB",
};

export function canUseVoiceMessages(plan: Plan) {
  return plan === "soulmate";
}

export function getStorageLimit(plan: Plan) {
  return PLAN_STORAGE[plan];
}

export function formatStorageLimit(plan: Plan) {
  return PLAN_STORAGE_LABEL[plan];
}
