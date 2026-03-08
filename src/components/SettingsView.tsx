import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useMyCouple } from "@/hooks/useCouple";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, Loader2, Save, Heart, Moon, Sun, Link2, ShieldCheck,
  Trash2, Crown, LogOut, Lock, LockOpen, Fingerprint, Smartphone, Download, X, KeyRound,
} from "lucide-react";
import { PartnerConnect } from "@/components/PartnerConnect";
import { usePlan } from "@/hooks/useSubscription";
import { getIsLockEnabled, getSavedPin, enableLock, setLockPin, disableLock } from "@/components/AppLock";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props { onNavigateBilling: () => void; }

export function SettingsView({ onNavigateBilling }: Props) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { data: couple } = useMyCouple();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const rawPlan = usePlan();
  const plan = rawPlan as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? user?.email?.split("@")[0] ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── App Lock state ──────────────────────────────────────────────────────────
  const [lockEnabled, setLockEnabled] = useState(getIsLockEnabled);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  // PIN setup/change modes
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinDraft, setPinDraft] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");

  // ── PWA install state ───────────────────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then(a => setBiometricAvailable(a))
        .catch(() => {});
    }
  }, []);

  const currentAvatarUrl = avatarUrl ?? profile?.avatar_url ?? null;
  const initials = (profile?.display_name ?? user?.email ?? "U").slice(0, 2).toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(url);
      await updateProfile.mutateAsync({ avatarUrl: url });
      toast({ title: "Avatar updated" });
    } catch {
      toast({ title: "Error uploading avatar", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ displayName: displayName.trim() || undefined });
      toast({ title: "Profile saved" });
    } catch {
      toast({ title: "Error saving profile", variant: "destructive" });
    }
  };

  // Toggling lock on: biometric devices → enable directly; PIN devices → show PIN setup
  const handleEnableLock = () => {
    if (biometricAvailable) {
      enableLock();
      setLockEnabled(true);
      toast({ title: "Fingerprint lock enabled 🔒" });
    } else {
      setShowPinSetup(true);
      setShowPinChange(false);
      setPinStep("enter");
      setPinDraft("");
      setPinConfirm("");
      setPinError("");
    }
  };

  const handleDisableLock = () => {
    disableLock();
    setLockEnabled(false);
    setShowPinSetup(false);
    setShowPinChange(false);
    toast({ title: "App lock disabled" });
  };

  const handleChangePinOpen = () => {
    setShowPinChange(true);
    setShowPinSetup(false);
    setPinStep("enter");
    setPinDraft("");
    setPinConfirm("");
    setPinError("");
  };

  // ── PIN setup/change flow ───────────────────────────────────────────────────
  const handlePinDigit = (d: string) => {
    if (pinStep === "enter") {
      if (pinDraft.length >= 4) return;
      const next = pinDraft + d;
      setPinDraft(next);
      if (next.length === 4) { setPinStep("confirm"); setPinConfirm(""); setPinError(""); }
    } else {
      if (pinConfirm.length >= 4) return;
      const next = pinConfirm + d;
      setPinConfirm(next);
      if (next.length === 4) {
        if (next === pinDraft) {
          setLockPin(next);
          setLockEnabled(true);
          setShowPinSetup(false);
          setShowPinChange(false);
          setPinDraft(""); setPinConfirm(""); setPinStep("enter");
          toast({ title: showPinChange ? "PIN updated 🔒" : "PIN lock enabled 🔒" });
        } else {
          setPinError("PINs don't match. Try again.");
          setPinDraft(""); setPinConfirm(""); setPinStep("enter");
        }
      }
    }
  };

  const hasSavedPin = !!getSavedPin();

  const handlePinDelete = () => {
    if (pinStep === "enter") setPinDraft(p => p.slice(0, -1));
    else setPinConfirm(p => p.slice(0, -1));
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  const pinDisplay = pinStep === "enter" ? pinDraft : pinConfirm;
  const pinDots = Array.from({ length: 4 }, (_, i) => i < pinDisplay.length);
  const pinRows = [["1","2","3"],["4","5","6"],["7","8","9"]];

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-5 pb-24 sm:pb-8">

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Profile</CardTitle>
          <CardDescription className="text-xs">Manage your display name and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                {currentAvatarUrl && <AvatarImage src={currentAvatarUrl} alt="Avatar" />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-1.5 shadow-md hover:bg-primary/90 transition-colors">
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Display Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={user?.email ?? ""} disabled className="h-8 text-sm text-muted-foreground" />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending} size="sm" className="w-full">
            {updateProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Partner */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary fill-primary" /> Partner
          </CardTitle>
          <CardDescription className="text-xs">Link your partner so you share the vault together</CardDescription>
        </CardHeader>
        <CardContent>
          {couple?.status === "active" ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/15 px-3 py-2.5">
              <Heart className="h-4 w-4 text-primary fill-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">Partner connected ✓</span>
            </div>
          ) : (
            <PartnerConnect />
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" /> Subscription
          </CardTitle>
          <CardDescription className="text-xs">
            {plan === "soulmate" ? "Soulmate plan — full access" : plan === "dating" ? "Dating plan active" : "Free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onNavigateBilling} variant="outline" size="sm" className="w-full">
            <Crown className="h-3.5 w-3.5 mr-2 text-primary" />
            {plan === "free" ? "Upgrade Plan" : "Manage Plan"}
          </Button>
        </CardContent>
      </Card>

      {/* App Lock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> App Lock
          </CardTitle>
          <CardDescription className="text-xs">
            {biometricAvailable
              ? "Protect your vault with fingerprint / Face ID"
              : "Protect your vault with a 4-digit PIN"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Toggle row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lockEnabled
                ? (biometricAvailable
                    ? <Fingerprint className="h-4 w-4 text-primary" />
                    : <Lock className="h-4 w-4 text-primary" />)
                : <LockOpen className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">
                  {lockEnabled
                    ? (biometricAvailable ? "Fingerprint lock on" : "PIN lock on")
                    : "Lock disabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lockEnabled
                    ? (biometricAvailable ? "Biometric required to open app" : "PIN required to open app")
                    : (biometricAvailable ? "Enable to require fingerprint on open" : "Enable to require PIN on open")}
                </p>
              </div>
            </div>
            <Switch
              checked={lockEnabled}
              onCheckedChange={(v) => v ? handleEnableLock() : handleDisableLock()}
            />
          </div>

          {/* PIN setup (only shown when biometric unavailable and user toggles on) */}
          {showPinSetup && !biometricAvailable && (
            <div className="border border-border rounded-xl p-4 bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">
                  {pinStep === "enter" ? "Set a 4-digit PIN" : "Confirm your PIN"}
                </p>
                <button onClick={() => { setShowPinSetup(false); setPinDraft(""); setPinConfirm(""); setPinError(""); }}
                  className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {pinError && <p className="text-xs text-destructive font-medium">{pinError}</p>}
              <div className="flex justify-center gap-4">
                {pinDots.map((filled, i) => (
                  <div key={i} className={cn(
                    "h-3.5 w-3.5 rounded-full border-2 transition-all duration-150",
                    filled ? "bg-primary border-primary scale-110" : "border-border bg-transparent"
                  )} />
                ))}
              </div>
              <div className="flex flex-col gap-2 items-center">
                {pinRows.map((row, ri) => (
                  <div key={ri} className="flex gap-2">
                    {row.map(d => (
                      <button key={d} onClick={() => handlePinDigit(d)}
                        className="h-12 w-12 rounded-xl bg-background hover:bg-muted active:scale-95 text-lg font-semibold text-foreground transition-all flex items-center justify-center border border-border shadow-sm">
                        {d}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-2">
                  <div className="h-12 w-12" />
                  <button onClick={() => handlePinDigit("0")}
                    className="h-12 w-12 rounded-xl bg-background hover:bg-muted active:scale-95 text-lg font-semibold text-foreground transition-all flex items-center justify-center border border-border shadow-sm">
                    0
                  </button>
                  <button onClick={handlePinDelete}
                    className="h-12 w-12 rounded-xl bg-background hover:bg-muted active:scale-95 flex items-center justify-center transition-all border border-border">
                    ←
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install App */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" /> Install App
          </CardTitle>
          <CardDescription className="text-xs">Add OurVault to your home screen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isInstalled ? (
            <div className="flex items-center gap-3 rounded-lg bg-primary/8 border border-primary/15 px-3 py-2.5">
              <Smartphone className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">App installed ✓</p>
                <p className="text-xs text-muted-foreground">Running as a standalone app</p>
              </div>
            </div>
          ) : installPrompt ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Install OurVault on your device for offline access, faster loading, and a native app feel.
              </p>
              <Button onClick={handleInstall} size="sm" className="w-full gap-2">
                <Download className="h-3.5 w-3.5" /> Install OurVault
              </Button>
            </div>
          ) : isIOS ? (
            <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">iOS Install Instructions</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                1. Tap the <span className="font-semibold">Share</span> button in Safari (the box with an arrow up).<br/>
                2. Scroll down and tap <span className="font-semibold">Add to Home Screen</span>.<br/>
                3. Tap <span className="font-semibold">Add</span> — OurVault will appear on your home screen.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Open OurVault in Chrome or Edge on your phone, then use the browser menu to install.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/15 p-3">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">End-to-end encrypted chat</p>
              <p className="text-xs text-muted-foreground mt-0.5">All messages are encrypted with AES-256-GCM before being stored. Only you and your partner can read them.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 border border-border p-3">
            <Trash2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">14-day deleted media recovery</p>
              <p className="text-xs text-muted-foreground mt-0.5">Deleted photos and videos are kept for 14 days before permanent removal.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 border border-border p-3">
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Private vault</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your media is only visible to you and your linked partner — no one else.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
