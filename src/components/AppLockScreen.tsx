import { useState, useEffect } from "react";
import { Fingerprint, Delete, Lock } from "lucide-react";
import { PIN_KEY, LOCK_KEY, LockMethod } from "@/hooks/useAppLock";
import { cn } from "@/lib/utils";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

interface Props {
  lockMethod: LockMethod;
  onUnlock: () => void;
}

export function AppLockScreen({ lockMethod, onUnlock }: Props) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Try biometric automatically on mount
  useEffect(() => {
    if (lockMethod === "biometric") {
      handleBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometric = async () => {
    setBiometricError(null);
    try {
      if (!("PublicKeyCredential" in window)) {
        setBiometricError("Biometrics not supported on this device");
        return;
      }
      // Use a get() assertion with userVerification required — browser triggers Face ID / Touch ID / Windows Hello
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname,
          allowCredentials: [],
        },
      });
      onUnlock();
    } catch (err: any) {
      // User cancelled or not enrolled — fall back to PIN if available
      const storedPin = localStorage.getItem(PIN_KEY);
      if (storedPin) {
        setBiometricError("Biometrics failed — enter your PIN");
        localStorage.setItem(LOCK_KEY, "pin");
      } else {
        setBiometricError("Biometrics not available. Please set up PIN in Settings.");
      }
    }
  };

  const handleKey = (k: string) => {
    if (k === "⌫") {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (!k) return;
    const next = pin + k;
    setPin(next);

    const stored = localStorage.getItem(PIN_KEY);
    if (next.length >= (stored?.length ?? 4)) {
      if (next === stored) {
        setTimeout(() => onUnlock(), 120);
      } else {
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);
      }
    }
  };

  const currentMethod = localStorage.getItem(LOCK_KEY) as LockMethod;
  const showPinPad = currentMethod === "pin" || (currentMethod === "biometric" && biometricError && !!localStorage.getItem(PIN_KEY));

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10 gap-3">
        <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-border">
          <img src="/pwa-icon-192.png" alt="OurVault" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-xl font-bold font-heading gradient-text">OurVault</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>App is locked</span>
        </div>
      </div>

      {/* Biometric button */}
      {currentMethod === "biometric" && (
        <div className="flex flex-col items-center gap-3 mb-8">
          <button
            onClick={handleBiometric}
            className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center transition-all active:scale-95",
              "bg-primary/10 border-2 border-primary/30 hover:bg-primary/20"
            )}
          >
            <Fingerprint className="h-10 w-10 text-primary" />
          </button>
          <span className="text-sm text-muted-foreground">
            {biometricError ?? "Touch to unlock"}
          </span>
        </div>
      )}

      {/* PIN pad */}
      {showPinPad && (
        <>
          {/* Dots */}
          <div className={cn("flex gap-3 mb-8 transition-all", shake && "animate-bounce")}>
            {Array.from({ length: Math.max(4, (localStorage.getItem(PIN_KEY)?.length ?? 4)) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-4 w-4 rounded-full border-2 transition-all duration-150",
                  i < pin.length
                    ? "border-primary bg-primary scale-110"
                    : "border-muted-foreground/40 bg-transparent"
                )}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-64">
            {KEYS.flat().map((k, idx) => (
              <button
                key={idx}
                onClick={() => handleKey(k)}
                disabled={!k}
                className={cn(
                  "h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95",
                  k === "⌫"
                    ? "text-muted-foreground hover:bg-muted/60"
                    : k
                    ? "bg-card border border-border hover:bg-accent text-foreground shadow-sm"
                    : "invisible"
                )}
              >
                {k === "⌫" ? <Delete className="h-5 w-5 mx-auto" /> : k}
              </button>
            ))}
          </div>
        </>
      )}

      {/* If biometric only, no PIN fallback */}
      {currentMethod === "biometric" && !biometricError && !localStorage.getItem(PIN_KEY) && (
        <p className="mt-6 text-xs text-muted-foreground/60 text-center px-8">
          Use your fingerprint or face to unlock
        </p>
      )}
    </div>
  );
}
