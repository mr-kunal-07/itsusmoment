import { useState, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Save, Heart, Moon, Sun, Link2, ShieldCheck, Trash2, Crown, LogOut } from "lucide-react";
import { PartnerConnect } from "@/components/PartnerConnect";
import { usePlan } from "@/hooks/useSubscription";

interface Props {
  onNavigateBilling: () => void;
}

export function SettingsView({ onNavigateBilling }: Props) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { data: couple } = useMyCouple();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const plan = usePlan();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? user?.email?.split("@")[0] ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-1.5 shadow-md hover:bg-primary/90 transition-colors"
              >
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="h-8 text-sm"
                />
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
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
        onClick={signOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
