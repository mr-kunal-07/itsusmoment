import { forwardRef } from "react";
import { Heart, Camera, MapPin, CalendarHeart, Star, Gift, Plane, Trophy } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

export type CardTheme = "rose" | "violet" | "peach" | "midnight" | "sage";

export const THEMES: Record<CardTheme, { bg: string; gradient: string; accent: string; text: string; subtext: string; cardBg: string; timelineLine: string; label: string }> = {
  rose: {
    label: "Rose",
    bg: "bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50",
    gradient: "linear-gradient(135deg, #fff0f3 0%, #ffe4ef 40%, #f8d7f5 100%)",
    accent: "text-rose-500",
    text: "text-gray-800",
    subtext: "text-gray-500",
    cardBg: "bg-white/80",
    timelineLine: "bg-rose-200",
  },
  violet: {
    label: "Violet",
    bg: "bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50",
    gradient: "linear-gradient(135deg, #f5f0ff 0%, #ede9ff 40%, #fce7ff 100%)",
    accent: "text-violet-500",
    text: "text-gray-800",
    subtext: "text-gray-500",
    cardBg: "bg-white/80",
    timelineLine: "bg-violet-200",
  },
  peach: {
    label: "Peach",
    bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50",
    gradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #ffe4e6 100%)",
    accent: "text-orange-500",
    text: "text-gray-800",
    subtext: "text-gray-500",
    cardBg: "bg-white/80",
    timelineLine: "bg-orange-200",
  },
  midnight: {
    label: "Midnight",
    bg: "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900",
    gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    accent: "text-pink-400",
    text: "text-white",
    subtext: "text-slate-400",
    cardBg: "bg-white/10",
    timelineLine: "bg-pink-500/30",
  },
  sage: {
    label: "Sage",
    bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
    gradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #cffafe 100%)",
    accent: "text-teal-600",
    text: "text-gray-800",
    subtext: "text-gray-500",
    cardBg: "bg-white/80",
    timelineLine: "bg-teal-200",
  },
};

const MILESTONE_ICONS: Record<string, typeof Heart> = {
  anniversary: CalendarHeart,
  milestone: Star,
  trip: Plane,
  birthday: Gift,
  photo: Camera,
  place: MapPin,
  default: Trophy,
};

interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string | null;
  type: string;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  theme: CardTheme;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  coupleStartDate: string | null;
  milestones: Milestone[];
  photoCount: number;
  messageCount: number;
  tripCount?: number;
}

// Floating heart positions — fixed so they don't shift on re-render
const HEARTS = [
  { top: "8%", left: "7%", size: 12, opacity: 0.15, delay: "0s" },
  { top: "15%", right: "9%", size: 18, opacity: 0.12, delay: "0.8s" },
  { top: "35%", left: "4%", size: 10, opacity: 0.1, delay: "1.4s" },
  { top: "55%", right: "5%", size: 14, opacity: 0.13, delay: "0.3s" },
  { top: "70%", left: "8%", size: 16, opacity: 0.1, delay: "1.1s" },
  { top: "82%", right: "11%", size: 12, opacity: 0.12, delay: "0.6s" },
  { top: "90%", left: "15%", size: 8, opacity: 0.08, delay: "1.8s" },
  { top: "25%", left: "50%", size: 8, opacity: 0.06, delay: "2s" },
];

export const LoveStoryCard = forwardRef<HTMLDivElement, Props>(({
  theme,
  myProfile,
  partnerProfile,
  coupleStartDate,
  milestones,
  photoCount,
  messageCount,
  tripCount = 0,
}, ref) => {
  const t = THEMES[theme];
  const daysTogether = coupleStartDate
    ? differenceInDays(new Date(), new Date(coupleStartDate))
    : 0;

  const myName = myProfile?.display_name ?? "You";
  const partnerName = partnerProfile?.display_name ?? "Partner";
  const myInitials = myName.slice(0, 2).toUpperCase();
  const partnerInitials = partnerName.slice(0, 2).toUpperCase();

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  ).slice(0, 6);

  const stats = [
    { value: daysTogether.toLocaleString(), label: "Days Together", emoji: "❤️" },
    { value: photoCount.toLocaleString(), label: "Memories", emoji: "📸" },
    { value: (messageCount).toLocaleString(), label: "Messages", emoji: "💬" },
    { value: tripCount.toLocaleString(), label: "Milestones", emoji: "🏆" },
  ];

  const isDark = theme === "midnight";

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        width: 420,
        minHeight: 680,
        background: t.gradient,
        borderRadius: 28,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)"
          : "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8)",
      }}
    >
      {/* Floating hearts */}
      {HEARTS.map((h, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: h.top,
            left: "left" in h ? h.left : undefined,
            right: "right" in h ? (h as any).right : undefined,
            opacity: h.opacity,
            animation: `float-heart 4s ease-in-out infinite`,
            animationDelay: h.delay,
          }}
        >
          <Heart
            fill={isDark ? "#f472b6" : "#f43f5e"}
            color="transparent"
            style={{ width: h.size, height: h.size }}
          />
        </div>
      ))}

      <div className="relative z-10 p-7 flex flex-col gap-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 pt-1">
          {/* Avatars */}
          <div className="flex items-center gap-0">
            {/* My avatar */}
            <div
              className="h-16 w-16 rounded-full ring-4 overflow-hidden flex-shrink-0"
              style={{ ringColor: "white", boxShadow: isDark ? "0 0 0 4px rgba(255,255,255,0.15)" : "0 0 0 4px white" }}
            >
              {myProfile?.avatar_url ? (
                <img src={myProfile.avatar_url} alt={myName} className="h-full w-full object-cover" />
              ) : (
                <div className={cn("h-full w-full flex items-center justify-center text-xl font-bold", isDark ? "bg-pink-500/40 text-pink-100" : "bg-rose-100 text-rose-600")}>
                  {myInitials}
                </div>
              )}
            </div>

            {/* Heart between */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center z-10 -mx-1"
              style={{ background: isDark ? "rgba(244,63,94,0.3)" : "white", boxShadow: "0 2px 8px rgba(244,63,94,0.3)" }}
            >
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            </div>

            {/* Partner avatar */}
            <div
              className="h-16 w-16 rounded-full ring-4 overflow-hidden flex-shrink-0"
              style={{ boxShadow: isDark ? "0 0 0 4px rgba(255,255,255,0.15)" : "0 0 0 4px white" }}
            >
              {partnerProfile?.avatar_url ? (
                <img src={partnerProfile.avatar_url} alt={partnerName} className="h-full w-full object-cover" />
              ) : (
                <div className={cn("h-full w-full flex items-center justify-center text-xl font-bold", isDark ? "bg-violet-500/40 text-violet-100" : "bg-violet-100 text-violet-600")}>
                  {partnerInitials}
                </div>
              )}
            </div>
          </div>

          {/* Names */}
          <div className="text-center">
            <h1
              className={cn("text-2xl font-bold tracking-tight", t.text)}
              style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}
            >
              {myName} <span className={t.accent}>❤️</span> {partnerName}
            </h1>
            {coupleStartDate && (
              <p className={cn("text-xs mt-1 font-medium", t.subtext)}>
                Together since {format(new Date(coupleStartDate), "MMMM d, yyyy")}
              </p>
            )}
          </div>

          {/* OurVault badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)" }}
          >
            <Heart className="h-2.5 w-2.5 fill-current" />
            OurVault
          </div>
        </div>

        {/* ── Stats Row ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
        >
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="text-base">{s.emoji}</span>
                <span className={cn("text-lg font-bold leading-tight", t.text)} style={{ fontFamily: "system-ui, sans-serif" }}>
                  {s.value}
                </span>
                <span className={cn("text-[9px] text-center leading-tight", t.subtext)} style={{ fontFamily: "system-ui, sans-serif" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────────────── */}
        {sortedMilestones.length > 0 && (
          <div className="flex flex-col gap-0">
            <h2
              className={cn("text-xs font-bold uppercase tracking-widest mb-3", t.subtext)}
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Our Story
            </h2>

            <div className="relative pl-5">
              {/* Vertical line */}
              <div
                className={cn("absolute left-2 top-3 bottom-3 w-0.5", t.timelineLine)}
              />

              <div className="flex flex-col gap-4">
                {sortedMilestones.map((m, idx) => {
                  const IconComp = MILESTONE_ICONS[m.type] ?? MILESTONE_ICONS.default;
                  const isLast = idx === sortedMilestones.length - 1;
                  return (
                    <div key={m.id} className="relative flex gap-3 items-start">
                      {/* Icon dot */}
                      <div
                        className="absolute -left-3 top-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isDark ? "rgba(244,63,94,0.25)" : "white",
                          boxShadow: isDark ? "0 0 0 2px rgba(244,63,94,0.4)" : "0 0 0 2px #fecdd3",
                        }}
                      >
                        <IconComp className={cn("h-2.5 w-2.5", t.accent)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn("text-sm font-semibold leading-tight", t.text)}
                            style={{ fontFamily: "system-ui, sans-serif" }}
                          >
                            {m.title}
                          </span>
                        </div>
                        <p
                          className={cn("text-[10px] mt-0.5", t.subtext)}
                          style={{ fontFamily: "system-ui, sans-serif" }}
                        >
                          {format(new Date(m.date), "MMM d, yyyy")}
                          {m.description ? ` · ${m.description}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center pt-2">
          <p
            className={cn("text-[10px] tracking-widest uppercase font-medium", t.subtext)}
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            Made with ❤️ on OurVault
          </p>
        </div>
      </div>

      {/* Subtle top-right decorative circle */}
      <div
        className="absolute -top-16 -right-16 h-48 w-48 rounded-full pointer-events-none"
        style={{ background: isDark ? "rgba(168,85,247,0.08)" : "rgba(244,63,94,0.06)" }}
      />
      <div
        className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full pointer-events-none"
        style={{ background: isDark ? "rgba(244,63,94,0.06)" : "rgba(139,92,246,0.05)" }}
      />
    </div>
  );
});

LoveStoryCard.displayName = "LoveStoryCard";
