/**
 * AuthCallback.tsx — /auth/callback route handler
 *
 * Handles two flows:
 *
 * 1. OAuth (Google, etc.)
 *    Supabase redirects here after the provider grants access.
 *    The URL contains either:
 *      - A `code` query param  (PKCE flow)  → exchange for session
 *      - A `#access_token` hash fragment    (implicit flow) → supabase-js
 *        auto-detects and fires INITIAL_SESSION/SIGNED_IN via onAuthStateChange
 *
 * 2. Email confirmation / magic link / password reset
 *    Same callback URL, same handling — supabase-js processes the token
 *    automatically from the URL when the listener is active.
 *
 * In both cases: wait for onAuthStateChange to fire (already set up in
 * AuthProvider), then navigate to the intended destination.
 *
 * You must add this route in App.tsx:
 *   <Route path="/auth/callback" element={<AuthCallback />} />
 *
 * And in Supabase dashboard → Authentication → URL Configuration:
 *   Site URL:           http://localhost:8080   (prod: your domain)
 *   Redirect URLs:      http://localhost:8080/auth/callback
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
    ephemeralStorage,
    JOIN_REDIRECT_KEY,
    sanitiseRedirect,
    authLog,
} from "@/hooks/useAuth";

// Fallback destination if no stored redirect path exists
const DEFAULT_DEST = "/";

export default function AuthCallback() {
    const navigate = useNavigate();
    const didRun = useRef(false);

    useEffect(() => {
        // Strict-mode double-invoke guard
        if (didRun.current) return;
        didRun.current = true;

        let timeoutId: ReturnType<typeof setTimeout>;

        // supabase-js v2 automatically detects both:
        //   ?code=...       (PKCE — exchanges code for session internally)
        //   #access_token=  (implicit — parses hash and fires SIGNED_IN)
        // We just need to wait for the auth state to resolve.

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                authLog.info("callback event", { event, userId: session?.user.id });

                if (
                    event === "SIGNED_IN" ||
                    event === "TOKEN_REFRESHED" ||
                    event === "INITIAL_SESSION"
                ) {
                    if (session) {
                        clearTimeout(timeoutId);
                        redirect();
                    }
                }

                // Password recovery — send to reset-password page directly
                if (event === "PASSWORD_RECOVERY") {
                    clearTimeout(timeoutId);
                    navigate("/reset-password", { replace: true });
                }
            }
        );

        // Safety timeout: if no auth event fires within 8s, something went wrong.
        // Navigate to login so the user isn't stuck on a blank callback screen.
        timeoutId = setTimeout(() => {
            authLog.warn("Auth callback timed out — no session received");
            navigate("/login?error=callback_timeout", { replace: true });
        }, 8000);

        function redirect() {
            // Check for a stored post-auth destination (set by useRequireAuth or join flow)
            const raw = ephemeralStorage.get(JOIN_REDIRECT_KEY);
            const safePath = sanitiseRedirect(raw);
            if (raw) ephemeralStorage.remove(JOIN_REDIRECT_KEY);

            const dest = safePath ?? DEFAULT_DEST;
            authLog.info("callback redirect", { dest });
            navigate(dest, { replace: true });
        }

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [navigate]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Completing sign in…</p>
        </div>
    );
}