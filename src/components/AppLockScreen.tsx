import { useState, useEffect } from "react";
import { Fingerprint, Delete, Lock, Eye, EyeOff, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { PIN_KEY, LOCK_KEY, LockMethod } from "@/hooks/useAppLock";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

type Screen = "lock" | "forgot-pin";

interface Props {
  lockMethod: LockMethod;
  onUnlock: () => void;
}

export function AppLockScreen({ lockMethod, onUnlock }: Props) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Forgot PIN state
  const [screen, setScreen] = useState<Screen>("lock");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

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

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Load the stored credential ID so the platform authenticator knows which key to use
      const credIdBase64 = localStorage.getItem("ourvault_biometric_cred_id");
      const allowCredentials: PublicKeyCredentialDescriptor[] = credIdBase64
        ? [{
            type: "public-key",
            id: Uint8Array.from(atob(credIdBase64), c => c.charCodeAt(0)),
            transports: ["internal"] as AuthenticatorTransport[],
          }]
        : [];

      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname,
          allowCredentials,
        },
      });
      onUnlock();
    } catch {
      // User cancelled or credential not found — fall back to PIN if available
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

  const handleForgotPin = async () => {
    if (!password.trim()) {
      setRecoveryError("Please enter your account password");
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError(null);
    try {
      // Get the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setRecoveryError("Could not find your account. Please try again.");
        setRecoveryLoading(false);
        return;
      }

      // Re-authenticate with their account password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        setRecoveryError("Incorrect password. Please try again.");
        setRecoveryLoading(false);
        return;
      }

      // Password verified — clear PIN and lock, then unlock
      localStorage.removeItem(PIN_KEY);
      localStorage.removeItem(LOCK_KEY);
      localStorage.removeItem("ourvault_biometric_cred_id");
      onUnlock();
    } catch {
      setRecoveryError("Something went wrong. Please try again.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const currentMethod = localStorage.getItem(LOCK_KEY) as LockMethod;
  const showPinPad = currentMethod === "pin" || (currentMethod === "biometric" && biometricError && !!localStorage.getItem(PIN_KEY));

  // ─── Forgot PIN screen ──────────────────────────────────────────────────────
  if (screen === "forgot-pin") {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none px-6"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* Back button */}
        <button
          onClick={() => { setScreen("lock"); setPassword(""); setRecoveryError(null); }}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-heading text-foreground">Forgot PIN?</h2>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Enter your account password to verify your identity. Your PIN and lock settings will be cleared so you can set them up again.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          {/* Password input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Account password"
              value={password}
              onChange={e => { setPassword(e.target.value); setRecoveryError(null); }}
              onKeyDown={e => e.key === "Enter" && handleForgotPin()}
              className={cn(
                "w-full h-12 rounded-xl px-4 pr-11 text-sm border bg-card text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                recoveryError ? "border-destructive focus:ring-destructive/50" : "border-border"
              )}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Error message */}
          {recoveryError && (
            <p className="text-xs text-destructive text-center">{recoveryError}</p>
          )}

          {/* Verify button */}
          <button
            onClick={handleForgotPin}
            disabled={recoveryLoading || !password.trim()}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]",
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {recoveryLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify & Reset Lock"
            )}
          </button>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            After verification, your PIN and biometric lock will be removed. You can set them up again in Settings.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main lock screen ───────────────────────────────────────────────────────
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

          {/* Forgot PIN link */}
          <button
            onClick={() => setScreen("forgot-pin")}
            className="mt-6 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
          >
            Forgot PIN?
          </button>
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
