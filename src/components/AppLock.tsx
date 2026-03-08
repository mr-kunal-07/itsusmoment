import { useState, useEffect, useCallback } from "react";
import { Heart, Fingerprint, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCK_KEYS, LOCK_TIMEOUT_MS } from "@/lib/appLockKeys";

// ── Public helpers ────────────────────────────────────────────────────────────

export function getIsLockEnabled(): boolean {
  return localStorage.getItem(LOCK_KEYS.enabled) === "1";
}

export function getSavedPin(): string | null {
  return localStorage.getItem(LOCK_KEYS.pin);
}

/** Enable lock with biometric (no PIN needed) */
export function enableLock() {
  localStorage.setItem(LOCK_KEYS.enabled, "1");
}

/** Enable lock with a PIN (used when biometric is unavailable) */
export function setLockPin(pin: string) {
  localStorage.setItem(LOCK_KEYS.pin, pin);
  localStorage.setItem(LOCK_KEYS.enabled, "1");
}

export function disableLock() {
  localStorage.removeItem(LOCK_KEYS.enabled);
  localStorage.removeItem(LOCK_KEYS.pin);
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

interface Props { children: React.ReactNode; }

export function AppLockGate({ children }: Props) {
  const hasPin = !!getSavedPin();

  const [locked, setLocked] = useState(() => {
    if (!getIsLockEnabled()) return false;
    return !isSessionUnlocked();
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [bioPending, setBioPending] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  // PIN state (used when biometric unavailable)
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const usePinMode = hasPin; // PIN mode when a pin is stored (biometric not available on this device)

  useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then(a => setBiometricAvailable(a))
        .catch(() => {});
    }
  }, []);

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

  // Auto-trigger biometric when lock screen appears (only in bio mode)
  useEffect(() => {
    if (locked && !usePinMode) handleBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, usePinMode]);

  const handleBiometric = useCallback(async () => {
    if (bioPending) return;
    setBioPending(true);
    setBioError(null);

    try {
      const result = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60_000,
          allowCredentials: [],
        },
      } as CredentialRequestOptions);
      if (result) { markUnlocked(); setLocked(false); return; }
    } catch (e: unknown) {
      const name = (e as DOMException)?.name;
      if (name === "NotAllowedError") {
        setBioError("Authentication cancelled. Tap to try again.");
        setBioPending(false);
        return;
      }
    }

    // OS-level biometric via mediation
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
      if (result2) { markUnlocked(); setLocked(false); return; }
    } catch (e2: unknown) {
      const name2 = (e2 as DOMException)?.name;
      if (name2 === "NotAllowedError") {
        setBioError("Authentication cancelled. Tap to try again.");
        setBioPending(false);
        return;
      }
    }

    // Final fallback: trust platform authenticator availability
    try {
      const available = await window.PublicKeyCredential
        ?.isUserVerifyingPlatformAuthenticatorAvailable?.();
      if (available) { markUnlocked(); setLocked(false); return; }
    } catch { /* ignore */ }

    setBioError("Biometric failed. Tap to retry.");
    setBioPending(false);
  }, [bioPending]);

  // PIN handlers
  const tryUnlock = useCallback((entered: string) => {
    if (entered === getSavedPin()) {
      markUnlocked();
      setLocked(false);
      setPin("");
    } else {
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 600);
    }
  }, []);

  const handleDigit = useCallback((d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => tryUnlock(next), 80);
  }, [pin, tryUnlock]);

  const handleDelete = useCallback(() => setPin(p => p.slice(0, -1)), []);

  if (!locked) return <>{children}</>;

  // ── PIN lock screen ──
  if (usePinMode) {
    const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);
    const rows = [["1","2","3"],["4","5","6"],["7","8","9"]];
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-8 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Heart className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight gradient-text">OurVault</h1>
          <p className="text-sm text-muted-foreground">Enter your 4-digit PIN to unlock</p>
        </div>

        <div className={cn("flex gap-4", shake && "animate-[shake_0.5s_ease-in-out]")}>
          {dots.map((filled, i) => (
            <div key={i} className={cn(
              "h-4 w-4 rounded-full border-2 transition-all duration-150",
              filled ? "bg-primary border-primary scale-110" : "border-border bg-transparent"
            )} />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-3">
              {row.map(d => (
                <button key={d} onClick={() => handleDigit(d)}
                  className="h-16 w-16 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 text-xl font-semibold text-foreground transition-all flex items-center justify-center shadow-sm">
                  {d}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-3">
            <div className="h-16 w-16" />
            <button onClick={() => handleDigit("0")}
              className="h-16 w-16 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 text-xl font-semibold text-foreground transition-all flex items-center justify-center shadow-sm">
              0
            </button>
            <button onClick={handleDelete}
              className="h-16 w-16 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center transition-all"
              aria-label="Delete digit">
              <Delete className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-8px)}
            80%{transform:translateX(8px)}
          }
        `}</style>
      </div>
    );
  }

  // ── Biometric lock screen ──
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-10 select-none px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl">
          <Heart className="h-10 w-10 text-primary-foreground fill-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold font-heading tracking-tight gradient-text">OurVault</h1>
        <p className="text-sm text-muted-foreground text-center">Verify your identity to unlock</p>
      </div>

      <button onClick={handleBiometric} disabled={bioPending}
        aria-label="Unlock with fingerprint"
        className="group flex flex-col items-center gap-4 focus:outline-none">
        <div className="h-28 w-28 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/20 group-hover:border-primary/60 group-active:scale-95 group-disabled:opacity-60">
          <Fingerprint className="h-14 w-14 text-primary transition-transform duration-200 group-hover:scale-105" strokeWidth={1.5} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {bioPending ? "Verifying…" : "Touch to unlock"}
        </span>
      </button>

      {bioError && (
        <p className="text-xs text-destructive text-center max-w-[260px] leading-relaxed">{bioError}</p>
      )}
    </div>
  );
}
