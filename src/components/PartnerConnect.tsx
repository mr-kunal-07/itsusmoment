import { useState } from "react";
import { useMyCouple, useCreateInvite, useAcceptInvite, useUnlinkPartner } from "@/hooks/useCouple";
import { useAllProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, Copy, Check, Link2, Link2Off, Loader2, RefreshCw, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PartnerConnect() {
  const { user } = useAuth();
  const { data: couple, isLoading } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const createInvite = useCreateInvite();
  const acceptInvite = useAcceptInvite();
  const unlinkPartner = useUnlinkPartner();
  const { toast } = useToast();

  const [enteredCode, setEnteredCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"generate" | "enter">("generate");
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

  const partnerId = couple
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profileMap[partnerId] : null;
  const isLinked = couple?.status === "active";
  const isPending = couple?.status === "pending";

  const handleCopy = () => {
    if (!couple?.invite_code) return;
    navigator.clipboard.writeText(couple.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      toast({ title: "🎉 Partner linked! You now share the vault." });
      setEnteredCode("");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const handleUnlink = async () => {
    if (!couple) return;
    try {
      await unlinkPartner.mutateAsync(couple.id);
      toast({ title: "Partner unlinked" });
    } catch {
      toast({ title: "Failed to unlink", variant: "destructive" });
    }
    setConfirmUnlink(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  // ── Active couple ──────────────────────────────────────────────────
  if (isLinked && partnerProfile) {
    const partnerName = partnerProfile.display_name ?? "Your Partner";
    const partnerInitials = partnerName.slice(0, 2).toUpperCase();

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/40">
              {partnerProfile.avatar_url && <AvatarImage src={partnerProfile.avatar_url} />}
              <AvatarFallback>{partnerInitials}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 text-base">💑</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{partnerName}</p>
            <p className="text-xs text-muted-foreground">{profiles.find(p => p.user_id === partnerId)?.user_id?.slice(0, 8)}…</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
            <Heart className="h-3 w-3 fill-current" /> Linked
          </Badge>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Both of you are <strong className="text-foreground">co-admins</strong> of this vault</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
            <li>Both can upload, edit and delete any photo or video</li>
            <li>Both can create and manage folders</li>
            <li>You both share all memories, love notes & anniversaries</li>
          </ul>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmUnlink(true)}
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <Link2Off className="h-4 w-4" /> Unlink Partner
        </Button>

        <AlertDialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink partner?</AlertDialogTitle>
              <AlertDialogDescription>
                You and {partnerName} will no longer share the vault. Your files won't be deleted but you won't see each other's media.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlink} className="bg-destructive text-destructive-foreground">Unlink</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── Pending invite ────────────────────────────────────────────────
  if (isPending && couple?.user1_id === user?.id) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Share this code with your partner so they can join your vault:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-xl font-bold tracking-widest text-center py-3 bg-muted rounded-lg text-foreground">
              {couple.invite_code}
            </div>
            <Button size="icon" variant="outline" onClick={handleCopy} className="h-12 w-12 shrink-0">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Waiting for partner to enter this code…</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-muted-foreground"
          onClick={() => unlinkPartner.mutate(couple.id)}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Cancel invite
        </Button>
      </div>
    );
  }

  // ── No couple yet ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tabs */}
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
            {t === "generate" ? "Generate Code" : "Enter Code"}
          </button>
        ))}
      </div>

      {tab === "generate" ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-center">
          <Heart className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <p className="text-sm font-medium">Invite your partner</p>
          <p className="text-xs text-muted-foreground">Generate a code and share it with your partner. Once they enter it, you'll both share this vault.</p>
          <Button onClick={handleGenerateCode} disabled={createInvite.isPending} className="w-full gap-2">
            {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Generate Invite Code
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Enter the code your partner shared with you:</p>
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
            Join Vault
          </Button>
        </div>
      )}
    </div>
  );
}
