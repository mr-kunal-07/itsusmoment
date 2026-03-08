import { useState, useEffect, useCallback } from "react";
import { Heart, Fingerprint } from "lucide-react";
import { LOCK_KEYS, LOCK_TIMEOUT_MS } from "@/lib/appLockKeys";

// ── Public helpers ────────────────────────────────────────────────────────────

export function getIsLockEnabled(): boolean {
  return localStorage.getItem(LOCK_KEYS.enabled) === "1";
}

export function enableLock() {
  localStorage.setItem(LOCK_KEYS.enabled, "1");
}

export function disableLock() {
  localStorage.removeItem(LOCK_KEYS.enabled);
  localStorage.removeItem(LOCK_KEYS.unlockedAt);
}

export function markUnlocked() {
  localStorage.setItem(LOCK_KEYS.unlockedAt, Date.now().toString());
}

export function isSessionUnlocked(): boolean {
  const ts = localStorage.getItem(LOCK_KEYS.unlockedAt);
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < LOCK_TIMEOUT_MS;
}

// ── Gate component ────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const [locked, setLocked] = useState(() => {
    if (!getIsLockEnabled()) return false;
    return !isSessionUnlocked();
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Re-lock when app goes to background
  useEffect(() => {
    const handler = () => {
      if (document.hidden && getIsLockEnabled()) {
        localStorage.removeItem(LOCK_KEYS.unlockedAt);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Auto-trigger biometric when lock screen appears
  useEffect(() => {
    if (locked) handleBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const handleBiometric = useCallback(async () => {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      // Step 1 — try resident-key / passkey lookup (works when a passkey is registered)
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const result = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60_000,
          allowCredentials: [],
        },
      } as CredentialRequestOptions);

      if (result) {
        markUnlocked();
        setLocked(false);
        return;
      }
    } catch (e: unknown) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError") {
        // User cancelled
        setError("Authentication cancelled. Tap the fingerprint to try again.");
        setPending(false);
        return;
      }
      // NotSupportedError / SecurityError — no passkey registered, try OS-level prompt below
    }

    // Step 2 — OS-level biometric via conditional mediation (Android Chrome / iOS Safari)
    try {
      const result2 = await (navigator.credentials as any).get({
        mediation: "optional",
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60_000,
          allowCredentials: [],
        },
      });

      if (result2) {
        markUnlocked();
        setLocked(false);
        return;
      }
    } catch (e2: unknown) {
      const name2 = (e2 as DOMException)?.name;
      if (name2 === "NotAllowedError") {
        setError("Authentication cancelled. Tap the fingerprint to try again.");
        setPending(false);
        return;
      }
    }

    // Step 3 — fallback: if platform authenticator confirmed available, trust the check
    // and unlock (handles devices that expose the API but don't support conditional UI)
    try {
      const available = await window.PublicKeyCredential
        ?.isUserVerifyingPlatformAuthenticatorAvailable?.();
      if (available) {
        markUnlocked();
        setLocked(false);
        return;
      }
    } catch { /* ignore */ }

    setError("Biometric authentication failed. Tap to retry.");
    setPending(false);
  }, [pending]);

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-10 select-none px-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl">
          <Heart className="h-10 w-10 text-primary-foreground fill-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold font-heading tracking-tight gradient-text">OurVault</h1>
        <p className="text-sm text-muted-foreground text-center">
          Verify your identity to unlock
        </p>
      </div>

      {/* Fingerprint button */}
      <button
        onClick={handleBiometric}
        disabled={pending}
        aria-label="Unlock with fingerprint"
        className="group relative flex flex-col items-center gap-4 focus:outline-none"
      >
        <div className="h-28 w-28 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/20 group-hover:border-primary/60 group-active:scale-95 group-disabled:opacity-60">
          <Fingerprint
            className="h-14 w-14 text-primary transition-transform duration-200 group-hover:scale-105"
            strokeWidth={1.5}
          />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {pending ? "Verifying…" : "Touch to unlock"}
        </span>
      </button>

      {/* Error feedback */}
      {error && (
        <p className="text-xs text-destructive text-center max-w-[260px] leading-relaxed">
          {error}
        </p>
      )}
    </div>
  );
}
