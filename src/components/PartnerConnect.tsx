import { useState, useEffect } from "react";
import { useMyCouple, useCreateInvite, useAcceptInvite } from "@/hooks/useCouple";
import { useAllProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Copy, Check, Link2, Loader2, Lock, Share2, UserCheck,
} from "lucide-react";
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
  const [tab, setTab] = useState<"generate" | "enter">("generate");

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const partnerId = couple
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profileMap[partnerId] : null;
  const isLinked = couple?.status === "active";
  const isPending = couple?.status === "pending";

  // Build shareable URL
  const inviteLink = couple?.invite_code
    ? `${window.location.origin}/join?code=${couple.invite_code}`
    : "";

  const handleCopyCode = () => {
    if (!couple?.invite_code) return;
    navigator.clipboard.writeText(couple.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join our vault 💕",
          text: "Hey love! Click this link to join our shared memory vault ❤️",
          url: inviteLink,
        });
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
      await acceptInvite.mutateAsync(enteredCode);
      toast({ title: "🎉 You're connected forever! 💕" });
      setEnteredCode("");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
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
    const partnerInitials = partnerName.slice(0, 2).toUpperCase();

    return (
      <div className="space-y-4">
        {/* Partner card */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/25 bg-primary/5">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/50">
              {partnerProfile.avatar_url && <AvatarImage src={partnerProfile.avatar_url} />}
              <AvatarFallback>{partnerInitials}</AvatarFallback>
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

        {/* Co-admin info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Both of you are <strong className="text-foreground">co-admins</strong> of this vault</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
            <li>Both can upload, edit and delete any photo or video</li>
            <li>Both can create and manage folders</li>
            <li>You both share all memories, love notes &amp; anniversaries</li>
          </ul>
        </div>

        {/* Loyalty lock — permanent, no unlink option */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Lock className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">This bond is permanent 🔒</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Once connected, partners cannot be unlinked. This is a sign of loyalty — one vault, one love, forever.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING INVITE (user created it) ──────────────────────────────
  if (isPending && couple?.user1_id === user?.id) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <p className="text-xs text-muted-foreground">Share this with your partner — they can use the code or click the link:</p>

          {/* Code display */}
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-xl font-bold tracking-widest text-center py-3 bg-muted rounded-lg text-foreground">
              {couple.invite_code}
            </div>
            <Button size="icon" variant="outline" onClick={handleCopyCode} className="h-12 w-12 shrink-0" title="Copy code">
              {copiedCode ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Share link */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Or share via link</p>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border">
              <p className="flex-1 text-xs text-muted-foreground truncate font-mono">{inviteLink}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? "Copied!" : "Copy Link"}
              </Button>
              <Button size="sm" onClick={handleShareLink} className="gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" />
                Share Link
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">⏳ Waiting for your partner to accept…</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          Once your partner accepts, this bond cannot be undone.
        </div>
      </div>
    );
  }

  // ── NO COUPLE YET ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
        {(["generate", "enter"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "py-1.5 text-xs font-medium rounded-md transition-colors",
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "generate" ? "Invite Partner" : "Enter Code / Link"}
          </button>
        ))}
      </div>

      {tab === "generate" ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <p className="text-sm font-medium">Invite your partner</p>
          <p className="text-xs text-muted-foreground">
            Generate a link or code and share it with your partner. Once they accept, you'll share this vault forever.
          </p>
          <Button onClick={handleGenerateCode} disabled={createInvite.isPending} className="w-full gap-2">
            {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Generate Invite Link
          </Button>
          <p className="text-[10px] text-amber-500 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> This connection will be permanent
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Enter the 8-character code your partner shared:</p>
          <Input
            placeholder="e.g. AB12CD34"
            value={enteredCode}
            onChange={e => setEnteredCode(e.target.value.toUpperCase())}
            className="font-mono tracking-widest text-center text-base uppercase"
            maxLength={8}
          />
          <Button
            onClick={handleAccept}
            disabled={enteredCode.length < 6 || acceptInvite.isPending}
            className="w-full gap-2"
          >
            {acceptInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
            Join Vault Forever
          </Button>
          <p className="text-[10px] text-amber-500 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> This connection will be permanent and cannot be undone
          </p>
        </div>
      )}
    </div>
  );
}
