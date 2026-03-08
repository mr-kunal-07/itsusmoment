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
  Camera, Loader2, Save, Heart, Moon, Sun, Link2,
  Trash2, Crown, LogOut, Smartphone, Download,
  Fingerprint, Lock, Eye, EyeOff, ShieldCheck, KeyRound,
} from "lucide-react";
import { PartnerConnect } from "@/components/PartnerConnect";
import { usePlan } from "@/hooks/useSubscription";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props { onNavigateBilling: () => void; }

const PIN_KEY = "ourvault_pin";
const LOCK_KEY = "ourvault_lock_method"; // "pin" | "biometric" | null

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

  // ── Security state ───────────────────────────────────────────────────────────
  const [lockMethod, setLockMethod] = useState<"pin" | "biometric" | null>(() => {
    const v = localStorage.getItem(LOCK_KEY);
    return (v === "pin" || v === "biometric") ? v : null;
  });
  const [hasPin, setHasPin] = useState(() => !!localStorage.getItem(PIN_KEY));
  const [pinSetupMode, setPinSetupMode] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirmInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const biometricSupported = typeof window !== "undefined" && "PublicKeyCredential" in window;

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

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  const handleSavePin = () => {
    if (pinInput.length < 4) { toast({ title: "PIN must be at least 4 digits", variant: "destructive" }); return; }
    if (pinInput !== pinConfirm) { toast({ title: "PINs don't match", variant: "destructive" }); return; }
    localStorage.setItem(PIN_KEY, pinInput);
    localStorage.setItem(LOCK_KEY, "pin");
    setHasPin(true);
    setLockMethod("pin");
    setPinSetupMode(false);
    setPinInput("");
    setPinConfirmInput("");
    toast({ title: "🔒 PIN lock enabled" });
  };

  const handleRemovePin = () => {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(LOCK_KEY);
    setHasPin(false);
    setLockMethod(null);
    setPinSetupMode(false);
    toast({ title: "PIN lock removed" });
  };

  const handleEnableBiometric = async () => {
    if (!biometricSupported) { toast({ title: "Biometrics not supported on this device", variant: "destructive" }); return; }
    try {
      // Request biometric credential creation as proof of device support
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "OurVault", id: window.location.hostname },
          user: { id: new TextEncoder().encode(user?.id ?? "user"), name: user?.email ?? "user", displayName: profile?.display_name ?? "User" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        },
      });
      if (credential) {
        localStorage.setItem(LOCK_KEY, "biometric");
        setLockMethod("biometric");
        toast({ title: "🔒 Biometric lock enabled" });
      }
    } catch (err: any) {
      if (err?.name === "NotAllowedError") toast({ title: "Biometric setup cancelled" });
      else toast({ title: "Biometric not available on this device", variant: "destructive" });
    }
  };

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

      {/* Security / App Lock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> App Lock
          </CardTitle>
          <CardDescription className="text-xs">Protect your vault with a PIN or biometrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lockMethod && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/15 px-3 py-2.5">
              {lockMethod === "biometric"
                ? <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                : <KeyRound className="h-4 w-4 text-primary shrink-0" />
              }
              <span className="text-sm font-medium text-foreground">
                {lockMethod === "biometric" ? "Biometric lock active ✓" : "PIN lock active ✓"}
              </span>
            </div>
          )}

          {/* Biometric */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fingerprint / Face ID</p>
                <p className="text-xs text-muted-foreground">
                  {biometricSupported ? "Use device biometrics to unlock" : "Not supported on this device"}
                </p>
              </div>
            </div>
            <Switch
              checked={lockMethod === "biometric"}
              onCheckedChange={v => v ? handleEnableBiometric() : handleDisableBiometric()}
              disabled={!biometricSupported}
            />
          </div>

          {/* PIN */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">PIN Lock</p>
                <p className="text-xs text-muted-foreground">{hasPin ? "PIN is set" : "Set a 4–6 digit PIN"}</p>
              </div>
            </div>
            <Switch
              checked={lockMethod === "pin"}
              onCheckedChange={v => v ? setPinSetupMode(true) : handleRemovePin()}
            />
          </div>

          {/* PIN setup inline form */}
          {pinSetupMode && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-medium text-foreground">Set your PIN</p>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter 4–6 digit PIN"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-8 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Confirm PIN"
                value={pinConfirm}
                onChange={e => setPinConfirmInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleSavePin} disabled={pinInput.length < 4}>
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Set PIN
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setPinSetupMode(false); setPinInput(""); setPinConfirmInput(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
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
              <Button onClick={handleInstall} size="sm" className="w-full gap-2">
                <Download className="h-3.5 w-3.5" />
                Install OurVault
              </Button>
              <p className="text-xs text-muted-foreground text-center">Add to home screen for quick access</p>
            </div>
          ) : isIOS ? (
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5 space-y-1">
              <p className="text-sm font-medium text-foreground">Install on iOS</p>
              <p className="text-xs text-muted-foreground">Tap the share button in Safari, then "Add to Home Screen"</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Open in Chrome or Edge to install this app</p>
          )}
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <LogOut className="h-4 w-4" /> Sign Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={async () => { await signOut(); navigate("/auth"); }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign out of OurVault
          </Button>
          <p className="text-xs text-muted-foreground text-center">You'll need to sign in again to access your vault</p>
        </CardContent>
      </Card>

    </div>
  );
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

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

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
              <Button onClick={handleInstall} size="sm" className="w-full gap-2">
                <Download className="h-3.5 w-3.5" />
                Install OurVault
              </Button>
              <p className="text-xs text-muted-foreground text-center">Add to home screen for quick access</p>
            </div>
          ) : isIOS ? (
            <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5 space-y-1">
              <p className="text-sm font-medium text-foreground">Install on iOS</p>
              <p className="text-xs text-muted-foreground">Tap the share button in Safari, then "Add to Home Screen"</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Open in Chrome or Edge to install this app</p>
          )}
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <LogOut className="h-4 w-4" /> Sign Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={async () => { await signOut(); navigate("/auth"); }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign out of OurVault
          </Button>
          <p className="text-xs text-muted-foreground text-center">You'll need to sign in again to access your vault</p>
        </CardContent>
      </Card>

    </div>
  );
}
