import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is admin
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roleRow } = await adminClient.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch all auth users
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

    // Fetch profiles, subscriptions, media stats, couples in parallel
    const [profilesRes, subsRes, mediaRes, couplesRes] = await Promise.all([
      adminClient.from("profiles").select("*"),
      adminClient.from("subscriptions").select("*").eq("status", "active"),
      adminClient.from("media").select("uploaded_by, file_size"),
      adminClient.from("couples").select("*").eq("status", "active"),
    ]);

    const profiles = profilesRes.data ?? [];
    const subscriptions = subsRes.data ?? [];
    const mediaItems = mediaRes.data ?? [];
    const couples = couplesRes.data ?? [];

    // Build a partner map: userId → partnerId
    const partnerMap: Record<string, string> = {};
    for (const c of couples) {
      if (c.user1_id && c.user2_id) {
        partnerMap[c.user1_id] = c.user2_id;
        partnerMap[c.user2_id] = c.user1_id;
      }
    }

    // Build a paid-plan map: userId → plan (only non-free/single plans)
    const paidPlanMap: Record<string, string> = {};
    for (const s of subscriptions) {
      if (s.plan && s.plan !== "free" && s.plan !== "single") {
        paidPlanMap[s.user_id] = s.plan;
      }
    }

    // Resolve effective plan: highest of own plan or partner's plan
    const PLAN_RANK: Record<string, number> = { soulmate: 3, dating: 2, single: 1, free: 0 };
    function getEffectivePlan(userId: string): string {
      const ownPlan = paidPlanMap[userId] ?? "single";
      const partnerId = partnerMap[userId];
      const partnerPlan = (partnerId && paidPlanMap[partnerId]) ? paidPlanMap[partnerId] : "single";
      const best = (PLAN_RANK[ownPlan] ?? 0) >= (PLAN_RANK[partnerPlan] ?? 0) ? ownPlan : partnerPlan;
      return best;
    }

    // Compute storage per user
    const storageMap: Record<string, number> = {};
    const uploadCountMap: Record<string, number> = {};
    for (const m of mediaItems) {
      storageMap[m.uploaded_by] = (storageMap[m.uploaded_by] ?? 0) + m.file_size;
      uploadCountMap[m.uploaded_by] = (uploadCountMap[m.uploaded_by] ?? 0) + 1;
    }

    const userList = authUsers.map((u) => {
      const profile = profiles.find((p) => p.user_id === u.id);
      const sub = subscriptions.find((s) => s.user_id === u.id);
      const isInCouple = couples.some((c) => c.user1_id === u.id || c.user2_id === u.id);
      const effectivePlan = getEffectivePlan(u.id);
      const isShared = !paidPlanMap[u.id] && effectivePlan !== "single";
      return {
        id: u.id,
        email: u.email,
        display_name: profile?.display_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        plan: effectivePlan,
        is_shared_plan: isShared,
        subscription_status: sub?.status ?? null,
        period_end: sub?.current_period_end ?? null,
        storage_used: storageMap[u.id] ?? 0,
        upload_count: uploadCountMap[u.id] ?? 0,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        has_partner: isInCouple,
      };
    });

    return new Response(JSON.stringify({ users: userList }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-list-users error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
