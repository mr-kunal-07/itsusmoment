import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ephemeralStorage, JOIN_REDIRECT_KEY, sanitiseRedirect, authLog } from "@/hooks/useAuth";

const DEFAULT_DEST = "/";
const CALLBACK_TIMEOUT_MS = 8000;

export default function AuthCallback() {
    const navigate = useNavigate();
    const didRun = useRef(false);

    useEffect(() => {
        if (didRun.current) return;
        didRun.current = true;

        const redirect = () => {
            const raw = ephemeralStorage.get(JOIN_REDIRECT_KEY);
            const safePath = sanitiseRedirect(raw);
            if (raw) ephemeralStorage.remove(JOIN_REDIRECT_KEY);
            const dest = safePath ?? DEFAULT_DEST;
            authLog.info("callback redirect", { dest });
            navigate(dest, { replace: true });
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            authLog.info("callback event", { event, userId: session?.user.id });

            if (event === "PASSWORD_RECOVERY") {
                clearTimeout(timeoutId);
                navigate("/reset-password", { replace: true });
                return;
            }

            if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
                clearTimeout(timeoutId);
                redirect();
            }
        });

        const timeoutId = setTimeout(() => {
            authLog.warn("Auth callback timed out — no session received");
            navigate("/login?error=callback_timeout", { replace: true });
        }, CALLBACK_TIMEOUT_MS);

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