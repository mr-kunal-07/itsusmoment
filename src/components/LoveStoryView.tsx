import { useRef, useState, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import {
  Download, Share2, Palette, Loader2, Heart, Sparkles,
  Settings2, Eye, Save, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { useMilestones } from "@/hooks/useMilestones";
import { useMedia } from "@/hooks/useMedia";
import { useMessages } from "@/hooks/useMessages";
import {
  LoveStoryCard,
  TemplateId, Customization, DEFAULT_CUSTOMIZATION,
  PALETTES, TEMPLATE_META,
} from "@/components/LoveStoryCard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "ourvault_love_story_";
const ALL_TEMPLATES: TemplateId[] = ["eternal", "polaroid", "bold", "cinema", "bloom"];

function loadCustomization(templateId: TemplateId): Customization {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + templateId);
    if (raw) return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_CUSTOMIZATION, paletteId: PALETTES[templateId][0].id };
}

function saveCustomization(templateId: TemplateId, c: Customization) {
  localStorage.setItem(STORAGE_PREFIX + templateId, JSON.stringify(c));
}

// ── Template Thumbnail ───────────────────────────────────────────────────────
function TemplateThumbnail({ templateId, isActive, onClick }: { templateId: TemplateId; isActive: boolean; onClick: () => void }) {
  const meta = TEMPLATE_META[templateId];
  const palette = PALETTES[templateId][0];
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all border-2 group",
        isActive
          ? "border-primary shadow-lg scale-[1.02]"
          : "border-transparent hover:border-border hover:bg-muted/30"
      )}
    >
      {/* Mini card preview */}
      <div
        className="w-full rounded-xl overflow-hidden relative"
        style={{ height: 100, background: palette.bg }}
      >
        {/* Mini hearts */}
        {[{ top: "15%", left: "10%", sz: 8 }, { top: "30%", right: "8%", sz: 10 }].map((h, i) => (
          <div key={i} style={{ position: "absolute", top: h.top, left: "left" in h ? h.left : "auto", right: "right" in h ? (h as any).right : "auto", opacity: 0.4 }}>
            <Heart fill={palette.accent} color="transparent" style={{ width: h.sz, height: h.sz }} />
          </div>
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <span style={{ fontSize: 22 }}>{meta.emoji}</span>
          <div style={{ width: 40, height: 3, borderRadius: 2, background: palette.accent, opacity: 0.6 }} />
          <div style={{ width: 28, height: 2, borderRadius: 2, background: palette.accent, opacity: 0.3 }} />
          <div style={{ width: 32, height: 2, borderRadius: 2, background: palette.accent, opacity: 0.25 }} />
        </div>
        {isActive && (
          <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded-xl" />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <p className={cn("text-xs font-semibold leading-none", isActive ? "text-primary" : "text-foreground")}>
          {meta.label}
        </p>
        <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{meta.description.split(",")[0]}</p>
      </div>

      {isActive && (
        <div className="absolute top-1.5 right-1.5 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────
export function LoveStoryView() {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const { data: profiles = [] } = useAllProfiles();
  const { data: couple } = useMyCouple();
  const { data: milestones = [] } = useMilestones();
  const { data: media = [] } = useMedia();
  const { data: messages = [] } = useMessages();

  const [activeTemplate, setActiveTemplate] = useState<TemplateId>("eternal");
  const [customizations, setCustomizations] = useState<Record<TemplateId, Customization>>(() => ({
    eternal:  loadCustomization("eternal"),
    polaroid: loadCustomization("polaroid"),
    bold:     loadCustomization("bold"),
    cinema:   loadCustomization("cinema"),
    bloom:    loadCustomization("bloom"),
  }));
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showCustomize, setShowCustomize] = useState(true);

  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id) : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) ?? null : null;

  const custom = customizations[activeTemplate];

  const setCustom = (patch: Partial<Customization>) => {
    setCustomizations(prev => ({
      ...prev,
      [activeTemplate]: { ...prev[activeTemplate], ...patch },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveCustomization(activeTemplate, custom);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "✅ Saved!", description: "Your customization has been saved." });
  };

  const handleSelectTemplate = (t: TemplateId) => {
    setActiveTemplate(t);
    setSaved(false);
  };

  const exportCard = useCallback(async (mode: "png" | "story" | "post") => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: { borderRadius: "28px" },
      });

      if (mode === "png") {
        const link = document.createElement("a");
        link.download = `ourvault-love-story-${activeTemplate}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "💾 Downloaded!", description: "High-res PNG saved." });
        return;
      }

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "love-story.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Our Love Story ❤️", text: "Check out our Love Story on OurVault 💕" });
        toast({ title: "Shared!" });
      } else {
        const link = document.createElement("a");
        link.download = mode === "story" ? "love-story-story.png" : "love-story-post.png";
        link.href = dataUrl;
        link.click();
        toast({
          title: "Downloaded for Instagram",
          description: mode === "story"
            ? "Open Instagram → Story → select this image."
            : "Open Instagram → Post → select this image.",
        });
      }
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [activeTemplate, toast]);

  const palettes = PALETTES[activeTemplate];
  const myName = myProfile?.display_name ?? "You";
  const partnerName = partnerProfile?.display_name ?? "Partner";
  const defaultTitle = `${myName} ❤️ ${partnerName}`;

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="px-3 sm:px-6 pt-2 pb-3 sm:pb-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-0.5">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold font-heading tracking-tight text-foreground">Love Story Card</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Choose a template, customize, and export.</p>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-24 sm:pb-10">
        {/* ── Template Gallery ─────────────────────────────────────────── */}
        <div className="mb-4 sm:mb-6">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-1.5">
            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Template
          </p>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {ALL_TEMPLATES.map(t => (
              <TemplateThumbnail
                key={t}
                templateId={t}
                isActive={activeTemplate === t}
                onClick={() => handleSelectTemplate(t)}
              />
            ))}
          </div>
        </div>

        {/* ── Main 2-column layout ──────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 items-start">

          {/* Card Preview */}
          <div className="flex-1 flex flex-col items-center gap-3 sm:gap-4 min-w-0">
            <div
              className="animate-scale-in w-full flex justify-center"
              style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.15))" }}
            >
              <LoveStoryCard
                ref={cardRef}
                templateId={activeTemplate}
                customization={custom}
                myProfile={myProfile ?? null}
                partnerProfile={partnerProfile}
                coupleStartDate={couple?.created_at ?? null}
                milestones={milestones}
                photoCount={media.length}
                messageCount={messages.length}
              />
            </div>

            {/* Export buttons below card */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              <Button onClick={() => exportCard("png")} disabled={exporting} size="sm" className="gap-1.5 h-8 text-xs rounded-xl px-3">
                {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Download
              </Button>
              <Button onClick={() => exportCard("story")} disabled={exporting} variant="outline" size="sm" className="gap-1.5 h-8 text-xs rounded-xl px-3">
                {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                Story
              </Button>
              <Button onClick={() => exportCard("post")} disabled={exporting} variant="outline" size="sm" className="gap-1.5 h-8 text-xs rounded-xl px-3">
                {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                Post
              </Button>
            </div>
          </div>

          {/* ── Customization Panel ──────────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0 space-y-3 sm:space-y-4">

            {/* Collapse toggle on mobile */}
            <button
              onClick={() => setShowCustomize(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-card shadow-sm text-sm font-semibold text-foreground lg:hidden"
            >
              <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-muted-foreground" /> Customize</span>
              {showCustomize ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            <div className={cn("space-y-4", !showCustomize && "hidden lg:block")}>

              {/* Color Palette */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Color Palette</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {palettes.map(palette => (
                    <button
                      key={palette.id}
                      onClick={() => setCustom({ paletteId: palette.id })}
                      title={palette.label}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all border-2",
                        (custom.paletteId || palettes[0].id) === palette.id
                          ? "border-primary scale-110 shadow-md"
                          : "border-transparent hover:scale-105 hover:border-border"
                      )}
                      style={{ background: palette.swatch }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {palettes.find(x => x.id === (custom.paletteId || palettes[0].id))?.label}
                </p>
              </div>

              {/* Text */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary fill-primary" /> Text
                </span>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Couple Title</Label>
                  <Input
                    value={custom.title}
                    onChange={e => setCustom({ title: e.target.value })}
                    placeholder={defaultTitle}
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">Leave blank to use partner names</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tagline / Quote</Label>
                  <Input
                    value={custom.tagline}
                    onChange={e => setCustom({ tagline: e.target.value })}
                    placeholder="Forever and always ❤️"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-2">
                <span className="text-sm font-semibold text-foreground">Together Since</span>
                <input
                  type="date"
                  value={custom.startDate || couple?.created_at?.slice(0, 10) || ""}
                  onChange={e => setCustom({ startDate: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-muted-foreground">Override the "Together since" date shown on the card</p>
              </div>

              {/* Sections */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <span className="text-sm font-semibold text-foreground">Sections</span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Stats</p>
                    <p className="text-xs text-muted-foreground">Days, photos, messages</p>
                  </div>
                  <Switch checked={custom.showStats} onCheckedChange={v => setCustom({ showStats: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Timeline</p>
                    <p className="text-xs text-muted-foreground">Milestones & anniversaries</p>
                  </div>
                  <Switch checked={custom.showTimeline} onCheckedChange={v => setCustom({ showTimeline: v })} />
                </div>
              </div>

              {/* Save */}
              <Button
                onClick={handleSave}
                className="w-full gap-2"
                variant={saved ? "secondary" : "default"}
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved!" : "Save Customization"}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Each template saves separately. Your customizations persist across sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
