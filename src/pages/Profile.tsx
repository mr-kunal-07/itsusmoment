import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Camera, Loader2, Save, Heart,
  User, Mail, Shield, CheckCircle2, Sparkles,
} from "lucide-react";
import { PartnerConnect } from "@/components/PartnerConnect";
import { cn } from "@/lib/utils";

// ─── Section ──────────────────────────────────────────────────────────────────

type SectionProps = {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  accent?: boolean;
};

function Section({
  icon: Icon,
  title,
  description,
  children,
  accent = false,
}: SectionProps) {
  if (!Icon && !title && !description && !children) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {(Icon || title || description) && (
        <div
          className={cn(
            "px-5 py-4 sm:px-6 sm:py-5 border-b border-border flex items-start gap-3",
            accent && "bg-gradient-to-r from-primary/5 to-transparent"
          )}
        >
          {Icon && (
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                accent
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}

          {(title || description) && (
            <div>
              {title && (
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {title}
                </p>
              )}
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {children && (
        <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      )}
    </div>
  );
}
// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/70 uppercase tracking-wide">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Avatar section (extracted for reuse in desktop sidebar) ──────────────────

function AvatarHero({
  currentAvatar,
  initials,
  displayName,
  email,
  isUploading,
  onCameraClick,
  size = "md",
}: {
  currentAvatar: string | null;
  initials: string;
  displayName: string;
  email: string;
  isUploading: boolean;
  onCameraClick: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const avatarSize = {
    sm: "h-16 w-16",
    md: "h-20 w-20 sm:h-24 sm:w-24",
    lg: "h-24 w-24 lg:h-28 lg:w-28",
  }[size];

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <Avatar className={cn(avatarSize, "ring-4 ring-background shadow-xl")}>
          {currentAvatar && <AvatarImage src={currentAvatar} alt="Your photo" />}
          <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={onCameraClick}
          disabled={isUploading}
          aria-label="Change profile photo"
          className={cn(
            "absolute bottom-0 right-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-lg",
            "bg-primary text-primary-foreground",
            "flex items-center justify-center",
            "ring-2 ring-background",
            "transition-all hover:scale-110 active:scale-95",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
          )}
        >
          {isUploading
            ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            : <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground leading-snug">
          {displayName || "Set your name"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{email}</p>
      </div>
    </div>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? user?.email?.split("@")[0] ?? ""
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentAvatar = avatarUrl ?? profile?.avatar_url ?? null;
  const initials = (profile?.display_name ?? user?.email ?? "U")
    .slice(0, 2)
    .toUpperCase();
  const isSaving = updateProfile.isPending && !isUploading;

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please choose a file under 5 MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const url = await uploadAvatar.mutateAsync(file);
        setAvatarUrl(url);
        await updateProfile.mutateAsync({ avatarUrl: url });
        toast({ title: "Photo updated", description: "Your avatar has been saved." });
      } catch {
        toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [uploadAvatar, updateProfile, toast]
  );

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const trimmed = displayName.trim();
    try {
      await updateProfile.mutateAsync({ displayName: trimmed || undefined });
      setSaved(true);
      toast({ title: "Profile saved" });
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    }
  }, [displayName, updateProfile, toast]);

  // ── Shared avatar click ────────────────────────────────────────────────────
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">Profile Settings</h1>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* ── Page body ── */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8 pb-16">

        {/*
         * LAYOUT STRATEGY
         * Mobile  (< lg): single column, avatar hero at top
         * Desktop (≥ lg): two columns
         *   Left  column (fixed sidebar feel): avatar card + security card
         *   Right column (main content):       profile fields + partner connect
         */}

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 xl:grid-cols-[300px_1fr] xl:gap-8">

          {/* ═══ LEFT COLUMN ═══════════════════════════════════════════════ */}
          <aside className="space-y-4 mb-5 lg:mb-0">

            {/* Avatar card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Gradient header band */}
              <div className="h-20 sm:h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative">
                <Sparkles className="absolute top-3 right-3 h-4 w-4 text-primary/40" />
              </div>

              {/* Avatar — overlaps the gradient band */}
              <div className="px-5 pb-5 -mt-10 sm:-mt-12 flex flex-col items-center gap-3">
                <AvatarHero
                  currentAvatar={currentAvatar}
                  initials={initials}
                  displayName={profile?.display_name ?? ""}
                  email={user?.email ?? ""}
                  isUploading={isUploading}
                  onCameraClick={openFilePicker}
                  size="lg"
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  Tap the camera icon to update your photo
                </p>
              </div>
            </div>

            {/* Security card — desktop: visible here; mobile: shown below profile form */}
            <div className="hidden lg:block">
              <SecurityCard />
            </div>
          </aside>

          {/* ═══ RIGHT COLUMN ══════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Profile form */}
            <Section  >
              <div className="space-y-5">
                <Field label="Display Name">
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    placeholder="Enter your display name"
                    maxLength={40}
                    className="h-10"
                  />
                </Field>

                <Field label="Email" >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={user?.email ?? ""}
                      disabled
                      className="pl-9 h-10 text-muted-foreground bg-muted/40 cursor-not-allowed"
                    />
                  </div>
                </Field>

                {/* Save button — three states */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || saved}
                  className={cn(
                    "w-full h-10 rounded-lg flex items-center justify-center gap-2",
                    "text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    saved
                      ? "bg-green-500/10 text-green-600 border border-green-200 dark:border-green-900/50"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
                    (isSaving || saved) && "cursor-not-allowed",
                  )}
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                  ) : saved ? (
                    <><CheckCircle2 className="h-4 w-4" />Saved!</>
                  ) : (
                    <><Save className="h-4 w-4" />Save Changes</>
                  )}
                </button>
              </div>
            </Section>

            {/* Security card — mobile only (hidden on lg+, shown in left column on desktop) */}
            <div className="lg:hidden">
              <SecurityCard />
            </div>

            {/* Partner connect */}
            <Section
              icon={Heart}
              title="Partner Access"
              description="Link your partner's account to share this private vault and chat space"
              accent
            >
              <PartnerConnect />
            </Section>

          </div>
        </div>
      </main>
    </div>
  );
}

// ─── SecurityCard — shared between mobile and desktop placements ──────────────

function SecurityCard() {
  return (
    <Section
      icon={Shield}
      title="Account Security"
      description="Your data is protected end-to-end"
    >
      <div className="space-y-3">
        {/* Encrypted row */}
        <div className="flex items-start gap-3 rounded-xl bg-muted/40 px-4 py-3.5">
          <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-snug">
              Encrypted &amp; private
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              All messages and memories are encrypted. Only you and your partner can see them.
            </p>
          </div>
        </div>

        {/* Info pills */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "🔒", label: "End-to-end encrypted" },
            { icon: "🚫", label: "No ads, ever" },
            { icon: "👁️", label: "Zero data selling" },
            { icon: "🛡️", label: "GDPR compliant" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2.5"
            >
              <span className="text-sm">{icon}</span>
              <span className="text-xs text-muted-foreground leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}