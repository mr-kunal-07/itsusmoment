import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download, Instagram, Share2, Palette, Loader2, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { useMilestones } from "@/hooks/useMilestones";
import { useMedia } from "@/hooks/useMedia";
import { useMessages } from "@/hooks/useMessages";
import { LoveStoryCard, THEMES, CardTheme } from "@/components/LoveStoryCard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const THEME_COLORS: Record<CardTheme, string> = {
  rose: "bg-gradient-to-br from-rose-300 to-pink-400",
  violet: "bg-gradient-to-br from-violet-300 to-purple-400",
  peach: "bg-gradient-to-br from-orange-300 to-amber-400",
  midnight: "bg-gradient-to-br from-slate-700 to-purple-900",
  sage: "bg-gradient-to-br from-teal-300 to-emerald-400",
};

export function LoveStoryView() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<CardTheme>("rose");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const { data: profiles = [] } = useAllProfiles();
  const { data: couple } = useMyCouple();
  const { data: milestones = [] } = useMilestones();
  const { data: media = [] } = useMedia();
  const { data: messages = [] } = useMessages();

  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) ?? null : null;

  const tripCount = milestones.length;
  const photoCount = media.length;
  const messageCount = messages.length;
  const coupleStartDate = couple?.created_at ?? null;

  const exportCard = useCallback(async (format: "story" | "post" | "png") => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      // For story (9:16) vs post (1:1), we adjust the scale
      const node = cardRef.current;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "transparent",
        style: { borderRadius: "28px" },
      });

      if (format === "png") {
        const link = document.createElement("a");
        link.download = `ourvault-love-story.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "💾 Downloaded!", description: "Your Love Story card is saved." });
        return;
      }

      // For Instagram: open native share sheet or copy image
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "love-story.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Our Love Story",
          text: "Check out our Love Story on OurVault! 💕",
        });
        toast({ title: "Shared!", description: "Opening share sheet…" });
      } else {
        // Fallback: download and tell user to share
        const link = document.createElement("a");
        link.download = format === "story" ? "love-story-story.png" : "love-story-post.png";
        link.href = dataUrl;
        link.click();
        toast({
          title: "Downloaded for Instagram",
          description: format === "story"
            ? "Open Instagram, tap + → Story, and select this image."
            : "Open Instagram, tap + → Post, and select this image.",
        });
      }
    } catch {
      toast({ title: "Export failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [toast]);

  return (
    <div className="min-h-full bg-background">
      {/* Page header */}
      <div className="px-4 pt-2 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Love Story</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A shareable card that captures your journey together. Export for Instagram Stories or Posts.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-24 sm:pb-10 flex flex-col lg:flex-row gap-8 items-start">

        {/* ── Card Preview ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center">
          <div
            className="relative animate-scale-in"
            style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.15))" }}
          >
            <LoveStoryCard
              ref={cardRef}
              theme={theme}
              myProfile={myProfile ?? null}
              partnerProfile={partnerProfile}
              coupleStartDate={coupleStartDate}
              milestones={milestones}
              photoCount={photoCount}
              messageCount={messageCount}
              tripCount={tripCount}
            />
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-64 flex flex-col gap-5 shrink-0">

          {/* Theme picker */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Theme</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(THEMES) as CardTheme[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={THEMES[t].label}
                  className={cn(
                    "h-9 w-full rounded-xl transition-all",
                    THEME_COLORS[t],
                    theme === t
                      ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md"
                      : "opacity-70 hover:opacity-100 hover:scale-105"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">{THEMES[theme].label}</p>
          </div>

          {/* Stats summary */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary fill-primary" /> Your Stats
            </span>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Milestones</span>
                <span className="font-medium text-foreground">{milestones.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos & Videos</span>
                <span className="font-medium text-foreground">{photoCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium text-foreground">{messageCount}</span>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" /> Export
            </span>

            <Button
              onClick={() => exportCard("png")}
              disabled={exporting}
              className="w-full gap-2 h-10"
              variant="default"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PNG
            </Button>

            <Button
              onClick={() => exportCard("story")}
              disabled={exporting}
              className="w-full gap-2 h-10"
              variant="outline"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
              Instagram Story
            </Button>

            <Button
              onClick={() => exportCard("post")}
              disabled={exporting}
              className="w-full gap-2 h-10"
              variant="outline"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
              Instagram Post
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed pt-1">
              On mobile, tapping Instagram buttons opens the native share sheet.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
