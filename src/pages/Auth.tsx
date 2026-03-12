import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Heart, Loader2, Mail, Lock, User, ArrowRight, ArrowLeft, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { lovable } from "@/integrations/lovable/index";

const PARTNER_CODE_KEY = "pending_partner_code";

type Mode = "signin" | "signup" | "forgot";

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Auth() {
  const { user, loading, signIn, signUp, resetPasswordForEmail } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [partnerCode, setPartnerCode] = useState("");

  // Post-auth actions (partner code + join redirect) are now handled in useAuth

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (partnerCode.trim()) {
      sessionStorage.setItem(PARTNER_CODE_KEY, partnerCode.trim().toUpperCase());
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, displayName);
    setSubmitting(false);
    if (error) {
      sessionStorage.removeItem(PARTNER_CODE_KEY);
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created! 🎉",
        description: partnerCode.trim()
          ? "Verify your email — your partner will be linked automatically."
          : "Check your email to verify your account.",
      });
      setMode("signin");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await resetPasswordForEmail(email);
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to send reset email", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "A password reset link has been sent." });
      setMode("signin");
    }
  };

  const handleGoogleSignIn = async () => {
    // Save partner code if entered before OAuth redirect
    if (partnerCode.trim()) {
      sessionStorage.setItem(PARTNER_CODE_KEY, partnerCode.trim().toUpperCase());
    }
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result && 'error' in result && result.error) {
      setGoogleLoading(false);
      toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
    }
    // If redirected, page navigates away — loading state stays
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-dots opacity-100 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/6 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
              <Heart className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">
              <span className="gradient-text">usMoment</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Your private couple space 💕</p>
        </div>

        {/* Card */}
        <div className={cn("glass-card p-7 animate-fade-in-up")} style={{ animationDelay: "0.1s" }}>

          {/* ── SIGN IN ── */}
          {mode === "signin" && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold font-heading">Welcome back</h2>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
              </div>

              {/* Google sign-in */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2.5 h-11 mb-4 border-border/60"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <Field label="Email" id="email">
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </Field>
                <Field label="Password" id="password">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4" />}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    suffix={
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:text-primary/80 transition-colors mt-1">
                    Forgot password?
                  </button>
                </Field>

                <Button type="submit" className="w-full gap-2 glow-primary mt-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Create one
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── SIGN UP ── */}
          {mode === "signup" && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold font-heading">Create account</h2>
                <p className="text-sm text-muted-foreground mt-1">Join the private vault</p>
              </div>

              {/* Google sign-up */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2.5 h-11 mb-4 border-border/60"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign up with Google
              </Button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <Field label="Your Name" id="displayName">
                  <InputWithIcon
                    icon={<User className="h-4 w-4" />}
                    id="displayName" type="text" placeholder="Your name"
                    value={displayName} onChange={e => setDisplayName(e.target.value)} required
                  />
                </Field>
                <Field label="Email" id="su-email">
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    id="su-email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </Field>
                <Field label="Password" id="su-password">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4" />}
                    id="su-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} required
                    suffix={
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </Field>
                <Field label="Confirm Password" id="confirmPassword">
                  <InputWithIcon
                    icon={<Lock className="h-4 w-4" />}
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  />
                </Field>

                {/* Partner code — optional */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="partnerCode" className="text-sm font-medium flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-primary" />
                      Partner's Invite Code
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Optional</span>
                  </div>
                  <InputWithIcon
                    icon={<Link2 className="h-4 w-4" />}
                    id="partnerCode"
                    type="text"
                    placeholder="e.g. AB12CD34"
                    value={partnerCode}
                    onChange={e => setPartnerCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="font-mono tracking-widest uppercase"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Have a code from your partner? Enter it here to connect instantly on signup.
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2 glow-primary mt-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                    {partnerCode.trim() ? <Heart className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    {partnerCode.trim() ? "Create & Connect" : "Create account"}
                  </>}
                </Button>
              </form>
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button onClick={() => setMode("signin")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <>
              <button onClick={() => setMode("signin")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
              <div className="mb-6">
                <h2 className="text-xl font-bold font-heading">Reset password</h2>
                <p className="text-sm text-muted-foreground mt-1">We'll send a reset link to your email</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <Field label="Email" id="forgot-email">
                  <InputWithIcon
                    icon={<Mail className="h-4 w-4" />}
                    id="forgot-email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </Field>
                <Button type="submit" className="w-full gap-2 glow-primary mt-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Private · Secure · Just for us ❤️
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

interface InputIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  suffix?: React.ReactNode;
}

function InputWithIcon({ icon, suffix, className, ...props }: InputIconProps) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted-foreground pointer-events-none">{icon}</span>
      <Input
        {...props}
        className={cn("pl-10 pr-10 bg-background/50 border-border/60 focus:border-primary/60 focus:ring-primary/20 h-11 transition-all", className)}
      />
      {suffix && (
        <span className="absolute right-3">{suffix}</span>
      )}
    </div>
  );
}
