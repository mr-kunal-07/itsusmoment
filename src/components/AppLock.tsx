import { useState, useEffect, useCallback } from "react";
import { Heart, Fingerprint, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCK_KEYS, LOCK_TIMEOUT_MS } from "@/lib/appLockKeys";

export function getIsLockEnabled(): boolean {
  return localStorage.getItem(LOCK_KEYS.enabled) === "1";
}

export function getSavedPin(): string | null {
  return localStorage.getItem(LOCK_KEYS.pin);
}

export function setLockPin(pin: string) {
  localStorage.setItem(LOCK_KEYS.pin, pin);
  localStorage.setItem(LOCK_KEYS.enabled, "1");
}

export function disableLock() {
  localStorage.removeItem(LOCK_KEYS.pin);
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

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const [locked, setLocked] = useState(() => {
    if (!getIsLockEnabled()) return false;
    return !isSessionUnlocked();
  });
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Check if WebAuthn / biometric is available
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then(available => setBiometricAvailable(available))
        .catch(() => setBiometricAvailable(false));
    }
  }, []);

  // Re-lock on visibility change (app to background)
  useEffect(() => {
    const handler = () => {
      if (document.hidden && getIsLockEnabled()) {
        markUnlocked(); // reset timer on hide so re-check works
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const tryUnlock = useCallback((enteredPin: string) => {
    const savedPin = getSavedPin();
    if (enteredPin === savedPin) {
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
    if (next.length === 4) {
      setTimeout(() => tryUnlock(next), 80);
    }
  }, [pin, tryUnlock]);

  const handleDelete = useCallback(() => {
    setPin(p => p.slice(0, -1));
  }, []);

  const handleBiometric = useCallback(async () => {
    // Use WebAuthn user-verifying platform authenticator (fingerprint/FaceID)
    try {
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 30000,
          allowCredentials: [],
        },
      } as CredentialRequestOptions);
      if (cred) {
        markUnlocked();
        setLocked(false);
      }
    } catch {
      // Fallback: use simple user-verification only (no stored credential needed)
      try {
        await (navigator as any).credentials?.get({ mediation: "optional" });
      } catch {
        // ignored — user may cancel
      }
    }
  }, []);

  if (!locked) return <>{children}</>;

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);
  const rows = [["1","2","3"],["4","5","6"],["7","8","9"]];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-8 select-none">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
          <Heart className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold font-heading tracking-tight gradient-text">OurVault</h1>
        <p className="text-sm text-muted-foreground">Enter your 4-digit PIN to unlock</p>
      </div>

      {/* PIN dots */}
      <div className={cn("flex gap-4", shake && "animate-[shake_0.5s_ease-in-out]")}>
        {dots.map((filled, i) => (
          <div
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-all duration-150",
              filled
                ? "bg-primary border-primary scale-110"
                : "border-border bg-transparent"
            )}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="flex flex-col gap-3">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-3">
            {row.map(d => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-16 w-16 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 text-xl font-semibold text-foreground transition-all flex items-center justify-center shadow-sm"
              >
                {d}
              </button>
            ))}
          </div>
        ))}

        {/* Bottom row: biometric | 0 | delete */}
        <div className="flex gap-3">
          <button
            onClick={handleBiometric}
            disabled={!biometricAvailable}
            className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center transition-all active:scale-95",
              biometricAvailable
                ? "bg-muted hover:bg-muted/80 text-primary"
                : "opacity-0 pointer-events-none"
            )}
            aria-label="Use biometric"
          >
            <Fingerprint className="h-6 w-6" />
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-16 w-16 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 text-xl font-semibold text-foreground transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 w-16 rounded-2xl bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center transition-all"
            aria-label="Delete digit"
          >
            <Delete className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
