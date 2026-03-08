import { useState } from "react";
import { useMyCouple, useCreateInvite, useAcceptInvite } from "@/hooks/useCouple";
import { useAllProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Copy, Check, Link2, Loader2, Lock, Share2, UserCheck, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export function PartnerConnect() {
  const { user } = useAuth();
  const { data: couple, isLoading } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const createInvite = useCreateInvite();
  const acceptInvite = useAcceptInvite();
  const { toast } = useToast();

  const [enteredCode, setEnteredCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mode, setMode] = useState<"invite" | "join">("invite");

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));
  const partnerId = couple ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id) : null;
  const partnerProfile = partnerId ? profileMap[partnerId] : null;
  const isLinked = couple?.status === "active";
  const isPending = couple?.status === "pending";
  const inviteLink = couple?.invite_code
    ? `${window.location.origin}/join?code=${couple.invite_code}`
    : "";

  const handleCopyCode = () => {
    if (!couple?.invite_code) return;
    navigator.clipboard.writeText(couple.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({ title: "Code copied!" });
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: "Link copied!" });
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join our vault 💕", text: "Hey love! Join our shared memory vault ❤️", url: inviteLink });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  const handleGenerateCode = async () => {
    try {
      await createInvite.mutateAsync();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const handleAccept = async () => {
    if (!enteredCode.trim()) return;
    try {
      await acceptInvite.mutateAsync(enteredCode.trim());
      toast({ title: "🎉 You're connected forever! 💕" });
      setEnteredCode("");
    } catch (e: any) {
      toast({ title: e.message ?? "Invalid code", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  // ── PERMANENTLY LINKED ─────────────────────────────────────────────
  if (isLinked && partnerProfile) {
    const partnerName = partnerProfile.display_name ?? "Your Partner";
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/25 bg-primary/5">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/50">
              {partnerProfile.avatar_url && <AvatarImage src={partnerProfile.avatar_url} />}
              <AvatarFallback>{partnerName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 text-base">💑</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{partnerName}</p>
            <p className="text-xs text-muted-foreground">Your forever partner</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
            <Heart className="h-3 w-3 fill-current" /> Linked
          </Badge>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Both of you are <strong className="text-foreground">co-admins</strong> of this vault</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5 pl-5 list-disc">
            <li>Upload, edit and delete any photo or video</li>
            <li>Create and manage folders</li>
            <li>Share memories, love notes &amp; anniversaries</li>
          </ul>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
          <Lock className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">This bond is permanent 🔒</strong> — one vault, one love, forever.
          </p>
        </div>
      </div>
    );
  }

  // ── PENDING INVITE ─────────────────────────────────────────────────
  if (isPending && couple?.user1_id === user?.id) {
    return (
      <div className="space-y-3">
        {/* Big code display */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Share this with your partner:</p>

          {/* Code */}
          <button
            onClick={handleCopyCode}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted rounded-xl hover:bg-accent transition-colors group"
          >
            <span className="font-mono text-2xl font-bold tracking-[.25em] text-foreground">
              {couple.invite_code}
            </span>
            <span className={cn("text-xs font-medium flex items-center gap-1 shrink-0", copiedCode ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
              {copiedCode ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy code</>}
            </span>
          </button>

          {/* Share link */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Copied!" : "Copy Link"}
            </Button>
            <Button size="sm" onClick={handleShare} className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              Share Link
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Waiting for your partner to accept…
        </div>

        {/* Also allow entering a code here in case partner shared theirs */}
        <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Got a code from your partner instead?</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter their code"
              value={enteredCode}
              onChange={e => setEnteredCode(e.target.value.toUpperCase())}
              className="font-mono tracking-widest text-center text-sm uppercase h-9"
              maxLength={8}
            />
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={enteredCode.length < 6 || acceptInvite.isPending}
              className="gap-1.5 shrink-0"
            >
              {acceptInvite.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
              Join
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── NO COUPLE YET ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
        {([["invite", "📤 Invite Partner"], ["join", "📥 Enter Code"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setMode(t)}
            className={cn(
              "py-2 text-xs font-medium rounded-md transition-colors",
              mode === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "invite" ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Invite your partner</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Generate a link + 8-character code. Share either one with your partner — they just tap to join.
              </p>
            </div>
            <Button onClick={handleGenerateCode} disabled={createInvite.isPending} className="w-full gap-2">
              {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Generate Invite Link &amp; Code
            </Button>
          </div>
          <p className="text-[11px] text-amber-500/80 flex items-center justify-center gap-1 text-center">
            <Lock className="h-3 w-3 shrink-0" /> Connecting is permanent — choose your partner carefully
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">Enter your partner's code</p>
              <p className="text-xs text-muted-foreground">The 8-character code from their invite, or paste the link below</p>
            </div>

            {/* Code input — big and obvious */}
            <Input
              placeholder="e.g. AB12CD34"
              value={enteredCode}
              onChange={e => {
                // Handle paste of full URL by extracting code
                const val = e.target.value;
                const match = val.match(/[?&]code=([A-Z0-9]{8})/i);
                if (match) {
                  setEnteredCode(match[1].toUpperCase());
                } else {
                  setEnteredCode(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
                }
              }}
              className="font-mono tracking-[.3em] text-center text-xl h-14 border-2 focus:border-primary"
              maxLength={8}
            />

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i < enteredCode.length ? "bg-primary" : "bg-muted"
                )} />
              ))}
            </div>

            <Button
              onClick={handleAccept}
              disabled={enteredCode.length < 6 || acceptInvite.isPending}
              className="w-full gap-2"
              size="lg"
            >
              {acceptInvite.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Heart className="h-4 w-4 fill-primary-foreground" />
              }
              Join Vault Forever
            </Button>
          </div>
          <p className="text-[11px] text-amber-500/80 flex items-center justify-center gap-1 text-center">
            <Lock className="h-3 w-3 shrink-0" /> This connection cannot be undone
          </p>
        </div>
      )}
    </div>
  );
}
