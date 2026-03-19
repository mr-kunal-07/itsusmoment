import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Create these plan IDs in your Razorpay dashboard under Products > Plans
const PLAN_IDS: Record<string, string> = {
    dating: Deno.env.get("RAZORPAY_PLAN_DATING") ?? "",
    soulmate: Deno.env.get("RAZORPAY_PLAN_SOULMATE") ?? "",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const json = (data: unknown, status = 200) =>
        new Response(JSON.stringify(data), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    try {
        const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RAZORPAY_KEY_ID) throw new Error("RAZORPAY_KEY_ID not configured");
        if (!RAZORPAY_KEY_SECRET) throw new Error("RAZORPAY_KEY_SECRET not configured");
        if (!SUPABASE_URL) throw new Error("SUPABASE_URL not configured");
        if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return json({ error: "Missing authorization" }, 401);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return json({ error: "Unauthorized" }, 401);

        const { plan = "dating" } = await req.json();
        const planId = PLAN_IDS[plan];
        if (!planId) return json({ error: `No Razorpay plan configured for: ${plan}` }, 400);

        const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

        // Create subscription via Razorpay API
        const subRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
            method: "POST",
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                plan_id: planId,
                total_count: 120,   // 10 years of monthly cycles
                quantity: 1,
                customer_notify: 1,     // Razorpay sends payment reminder emails
                notes: {
                    user_id: user.id,
                    plan,
                },
            }),
        });

        if (!subRes.ok) {
            const err = await subRes.json();
            throw new Error(`Razorpay subscription creation failed: ${JSON.stringify(err)}`);
        }

        const sub = await subRes.json();

        // Fetch plan details to get amount/currency for the checkout
        const planRes = await fetch(`https://api.razorpay.com/v1/plans/${planId}`, {
            headers: { Authorization: `Basic ${credentials}` },
        });
        const planData = await planRes.json();

        return json({
            key_id: RAZORPAY_KEY_ID,
            subscription_id: sub.id,
            amount: planData.item.amount,
            currency: planData.item.currency,
            description: `CoupleVault ${plan} plan`,
        });
    } catch (err) {
        console.error("razorpay-create-subscription error:", err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});