import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, Heart, Loader2, Mail, Lock,
  User, ArrowRight, ArrowLeft, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

/* ── Constants ──────────────────────────────────────────────────── */
const PARTNER_CODE_KEY = "pending_partner_code";

/* ── Types ──────────────────────────────────────────────────────── */
type Mode = "signin" | "signup" | "forgot";

/* ── Sub-components ─────────────────────────────────────────────── */

/** Tiny Google "G" SVG – kept isolated so it's tree-shakeable. */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface FieldProps {
  label: string;
  id: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}
function Field({ label, id, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint && <div className="mt-1">{hint}</div>}
    </div>
  );
}

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  suffix?: React.ReactNode;
}
function InputWithIcon({ icon, suffix, className, ...props }: InputWithIconProps) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted-foreground pointer-events-none select-none">
        {icon}
      </span>
      <Input
        {...props}
        className={cn(
          "pl-10 h-11 bg-background/50 border-border/60",
          "transition-all",
          suffix ? "pr-10" : "pr-3",
          className,
        )}
      />
      {suffix && (
        <span className="absolute right-3 flex items-center">{suffix}</span>
      )}
    </div>
  );
}

/** Reusable "Continue with Google" button. */
interface GoogleButtonProps {
  loading: boolean;
  onClick: () => void;
  label?: string;
}
function GoogleButton({ loading, onClick, label = "Continue with Google" }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2.5 h-11 border-border/60"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      {label}
    </Button>
  );
}

/** Horizontal "or" divider. */
function Divider() {
  return (
    <div className="flex py-5 items-center gap-3">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-xs text-muted-foreground select-none">or</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

/** Reusable submit button with spinner. */
interface SubmitButtonProps {
  loading: boolean;
  children: React.ReactNode;
}
function SubmitButton({ loading, children }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      className="w-full gap-2 glow-primary mt-2"
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

/** Toggle between show/hide password. */
interface PasswordToggleProps {
  show: boolean;
  onToggle: () => void;
}
function PasswordToggle({ show, onToggle }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────── */

export default function Auth() {
  const { user, loading, signIn, signUp, resetPasswordForEmail } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Shared field state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [partnerCode, setPartnerCode] = useState("");

  /* ── Auth: early returns ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  /* ── Helpers ───────────────────────────────────────────────────── */
  function resetForm() {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setConfirmPassword("");
    setPartnerCode("");
    setShowPassword(false);
  }

  function switchMode(next: Mode) {
    resetForm();
    setMode(next);
  }

  function savePartnerCode() {
    const code = partnerCode.trim().toUpperCase();
    if (code) sessionStorage.setItem(PARTNER_CODE_KEY, code);
  }

  function showError(title: string, message?: string) {
    toast({ title, description: message, variant: "destructive" });
  }

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) showError("Sign in failed", error.message);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      showError("Password too short", "Must be at least 6 characters.");
      return;
    }

    savePartnerCode();
    setSubmitting(true);
    const { error } = await signUp(email, password, displayName);
    setSubmitting(false);

    if (error) {
      sessionStorage.removeItem(PARTNER_CODE_KEY);
      showError("Sign up failed", error.message);
    } else {
      toast({
        title: "Account created! 🎉",
        description: partnerCode.trim()
          ? "Verify your email — your partner will be linked automatically."
          : "Check your email to verify your account.",
      });
      switchMode("signin");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await resetPasswordForEmail(email);
    setSubmitting(false);

    if (error) {
      showError("Failed to send reset email", error.message);
    } else {
      toast({ title: "Check your email", description: "A password reset link has been sent." });
      switchMode("signin");
    }
  };

  const handleGoogleSignIn = async () => {
    savePartnerCode();
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      showError("Google sign-in failed", error.message);
    }
  };

  /* ── Derived helpers ───────────────────────────────────────────── */
  const passwordSuffix = (
    <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
  );
  const passwordType = showPassword ? "text" : "password";
  const hasPartnerCode = partnerCode.trim().length > 0;

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="relative  flex items-center justify-center bg-background overflow-hidden px-4 py-10 sm:py-16">

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-10 w-10 rounded-xl ">
              <img src="/logo.png" alt="" />
            </div>
            <h1 className="text-2xl font-semibold">
              <span className="gradient-text">usMoment</span>
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>

          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <>
              <Header title="Welcome back" subtitle="Sign in to your account to continue" />

              <GoogleButton loading={googleLoading} onClick={handleGoogleSignIn} />

              <Divider />

              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <Field label="Email" id="si-email">
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    id="si-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>

                <Field
                  label="Password"
                  id="si-password"
                  hint={
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  }
                >
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4" />}
                    id="si-password"
                    type={passwordType}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    suffix={passwordSuffix}
                  />
                </Field>

                <SubmitButton loading={submitting}>
                  Sign in <ArrowRight className="h-4 w-4" />
                </SubmitButton>
              </form>

              <ModeSwitch
                question="Don't have an account?"
                action="Create one"
                onSwitch={() => switchMode("signup")}
              />
            </>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <>
              <Header title="Create account" subtitle="Join the private vault" />

              <GoogleButton
                loading={googleLoading}
                onClick={handleGoogleSignIn}
                label="Sign up with Google"
              />

              <Divider />

              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                <Field label="Your Name" id="su-name">
                  <InputWithIcon
                    icon={<User className="h-4 w-4" />}
                    id="su-name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </Field>

                <Field label="Email" id="su-email">
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    id="su-email"
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>

                <Field label="Password" id="su-password">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4" />}
                    id="su-password"
                    type={passwordType}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    suffix={passwordSuffix}
                  />
                </Field>

                <Field label="Confirm Password" id="su-confirm">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4" />}
                    id="su-confirm"
                    type={passwordType}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    suffix={passwordSuffix}
                  />
                </Field>

                {/* Optional partner code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="su-partner" className="text-sm font-medium flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      Partner's Invite Code
                    </Label>
                    <span className="text-[10px] text-muted-foreground select-none">Optional</span>
                  </div>
                  <InputWithIcon
                    icon={<Link2 className="h-4 w-4" />}
                    id="su-partner"
                    type="text"
                    placeholder="e.g. AB12CD34"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="font-mono tracking-widest uppercase"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Have a code from your partner? Enter it here to connect instantly on signup.
                  </p>
                </div>

                <SubmitButton loading={submitting}>
                  {hasPartnerCode ? (
                    <><Heart className="h-4 w-4" /> Create &amp; Connect</>
                  ) : (
                    <>Create account <ArrowRight className="h-4 w-4" /></>
                  )}
                </SubmitButton>
              </form>

              <ModeSwitch
                question="Already have an account?"
                action="Sign in"
                onSwitch={() => switchMode("signin")}
              />
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to sign in
              </button>

              <Header
                title="Reset password"
                subtitle="We'll send a reset link to your email"
              />

              <form onSubmit={handleForgot} className="space-y-4" noValidate>
                <Field label="Email" id="fp-email">
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    id="fp-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>

                <SubmitButton loading={submitting}>
                  Send reset link <ArrowRight className="h-4 w-4" />
                </SubmitButton>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6 select-none">
          Private · Secure · Just for us ❤️
        </p>
      </div>
    </div>
  );
}

/* ── Additional shared sub-components ───────────────────────────── */

interface HeaderProps {
  title: string;
  subtitle: string;
}
function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold font-heading">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

interface ModeSwitchProps {
  question: string;
  action: string;
  onSwitch: () => void;
}
function ModeSwitch({ question, action, onSwitch }: ModeSwitchProps) {
  return (
    <div className="mt-5 text-center">
      <p className="text-sm text-muted-foreground">
        {question}{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          {action}
        </button>
      </p>
    </div>
  );
}