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

    // Fetch audit log entries with profile info for target user and admin
    const { data: logs, error: logsErr } = await adminClient
      .from("plan_audit_log")
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(200);

    if (logsErr) throw new Error(logsErr.message);

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ logs: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Collect all unique user IDs to resolve names
    const userIds = [...new Set([
      ...logs.map((l: any) => l.target_user_id),
      ...logs.map((l: any) => l.changed_by_user_id),
    ])];

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    // Also get emails from auth
    const authUsers: Record<string, string> = {};
    for (const uid of userIds) {
      const { data: { user: u } } = await adminClient.auth.admin.getUserById(uid);
      if (u) authUsers[uid] = u.email ?? "";
    }

    const profileMap: Record<string, { display_name: string | null; avatar_url: string | null; email: string }> = {};
    for (const uid of userIds) {
      const p = (profiles ?? []).find((pr: any) => pr.user_id === uid);
      profileMap[uid] = {
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        email: authUsers[uid] ?? "",
      };
    }

    const enriched = logs.map((l: any) => ({
      ...l,
      target_user: profileMap[l.target_user_id] ?? null,
      changed_by_user: profileMap[l.changed_by_user_id] ?? null,
    }));

    return new Response(JSON.stringify({ logs: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-audit-log error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
