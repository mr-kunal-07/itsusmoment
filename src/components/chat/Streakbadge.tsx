import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Flame, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessageStreak } from "./Usemessagestreak";

// ─── Flame CSS animation ──────────────────────────────────────────────────────
// Injected once into <head> — guard prevents duplicate tags on re-mount / HMR.

if (typeof document !== "undefined" && !document.getElementById("streak-flame-style")) {
    const s = document.createElement("style");
    s.id = "streak-flame-style";
    s.innerHTML = `
    @keyframes flameFlicker {
      0%   { transform: scale(1);    }
      50%  { transform: scale(1.12); }
      100% { transform: scale(1);    }
    }
    .flame-lit { animation: flameFlicker 1.4s ease-in-out infinite; }
  `;
    document.head.appendChild(s);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MILESTONES: { days: number; message: string; emoji: string }[] = [
    { days: 3, message: "3 days in a row!", emoji: "🔥" },
    { days: 7, message: "One week streak!", emoji: "🌟" },
    { days: 14, message: "Two weeks strong!", emoji: "💪" },
    { days: 30, message: "One month of love!", emoji: "💕" },
    { days: 50, message: "50 days together!", emoji: "🎯" },
    { days: 100, message: "100 days of messages!", emoji: "🏆" },
    { days: 365, message: "A whole year!", emoji: "👑" },
];

const MILESTONE_DAYS = MILESTONES.map(m => m.days);

// ─── Monthly restore — localStorage ──────────────────────────────────────────
// 3 free restores per calendar month, persisted locally.
// Restore button appears in the detail panel when atRisk === true.

const RESTORE_KEY = "streak_restore_data";

interface RestoreData { month: string; used: number }

function useMonthlyRestores() {
    const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

    const [data, setData] = useState<RestoreData>(() => {
        if (typeof window === "undefined") return { month: currentMonth, used: 0 };
        try {
            const saved = localStorage.getItem(RESTORE_KEY);
            if (saved) {
                const parsed: RestoreData = JSON.parse(saved);
                if (parsed.month === currentMonth) return parsed;
            }
        } catch { /* ignore */ }
        return { month: currentMonth, used: 0 };
    });

    // Reset counter when the month rolls over mid-session
    useEffect(() => {
        if (data.month !== currentMonth) {
            const reset: RestoreData = { month: currentMonth, used: 0 };
            setData(reset);
            try { localStorage.setItem(RESTORE_KEY, JSON.stringify(reset)); } catch { /* ignore */ }
        }
    }, [currentMonth, data.month]);

    const consumeRestore = useCallback(() => {
        setData(prev => {
            const next: RestoreData = { ...prev, used: prev.used + 1 };
            try { localStorage.setItem(RESTORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    }, []);

    return {
        restoresLeft: Math.max(0, 3 - data.used),
        consumeRestore,
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusText(
    atRisk: boolean,
    bothSentToday: boolean,
    waitingForPartner: boolean,
    current: number,
): string {
    if (atRisk) return "Send a message to keep it alive";
    if (bothSentToday) return "Both of you sent today ✓";
    if (waitingForPartner) return "Waiting for partner today";
    if (current === 0) return "Start your streak today";
    return "Keep it going!";
}

function getStatusColor(
    atRisk: boolean,
    bothSentToday: boolean,
    waitingForPartner: boolean,
): string {
    if (atRisk) return "#ef4444";
    if (bothSentToday) return "#22c55e";
    if (waitingForPartner) return "#f97316";
    return "#6b7280";
}

function getNextMilestone(current: number): number | null {
    return MILESTONE_DAYS.find(d => d > current) ?? null;
}

// ─── MilestoneToast ───────────────────────────────────────────────────────────

const MilestoneToast = memo(function MilestoneToast({
    milestone,
    onDismiss,
}: {
    milestone: number;
    onDismiss: () => void;
}) {
    const info = MILESTONES.find(m => m.days === milestone);

    useEffect(() => {
        const tid = setTimeout(onDismiss, 4500);
        return () => clearTimeout(tid);
    }, [onDismiss]);

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
                "flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl",
                "border border-orange-200 whitespace-nowrap",
                "animate-in fade-in slide-in-from-top-2 duration-300",
            )}
            style={{ background: "#fff7ed" }}
        >
            <Flame size={15} className="text-orange-500 flame-lit" aria-hidden />
            <span className="text-xs font-semibold" style={{ color: "#c2410c" }}>
                {info?.emoji ?? "🎉"} {info?.message ?? `${milestone} day streak!`}
            </span>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="ml-1 text-orange-400 hover:text-orange-600 transition-colors"
            >
                <X size={11} />
            </button>
        </div>
    );
});

// ─── NextMilestoneHint ────────────────────────────────────────────────────────

const NextMilestoneHint = memo(function NextMilestoneHint({
    current,
}: {
    current: number;
}) {
    const next = getNextMilestone(current);
    if (!next) return null;

    const daysLeft = next - current;
    const pct = Math.round((current / next) * 100);
    const info = MILESTONES.find(m => m.days === next);

    return (
        <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>
                <span>Next milestone</span>
                <span className="font-semibold" style={{ color: "hsl(var(--wa-text))" }}>
                    {info?.emoji} {next} days
                </span>
            </div>
            <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ background: "hsl(var(--wa-system-bubble))" }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% toward ${next}-day milestone`}
            >
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: "#f97316" }}
                />
            </div>
            <p className="text-[10px] text-center" style={{ color: "hsl(var(--wa-meta))" }}>
                {daysLeft} more day{daysLeft !== 1 ? "s" : ""} to go
            </p>
        </div>
    );
});

// ─── StreakCalendarRow ────────────────────────────────────────────────────────
// Last 7 days shown as dot indicators — orange if a message was sent that day.

const StreakCalendarRow = memo(function StreakCalendarRow({
    activeDays,
}: {
    activeDays: string[];
}) {
    const days = useMemo(() => {
        const activeSet = new Set(activeDays);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString("en", { weekday: "narrow" });
            return { key, label, active: activeSet.has(key) };
        });
    }, [activeDays]);

    return (
        <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                style={{ color: "hsl(var(--wa-meta))" }}>
                Last 7 days
            </p>
            <div className="flex items-end justify-between gap-1">
                {days.map(day => (
                    <div key={day.key} className="flex flex-col items-center gap-1">
                        <div
                            className={cn(
                                "h-2.5 w-2.5 rounded-full transition-colors",
                                day.active ? "bg-orange-500" : "bg-muted/60",
                            )}
                            aria-label={`${day.label}: ${day.active ? "sent" : "no message"}`}
                        />
                        <span className="text-[9px]" style={{ color: "hsl(var(--wa-meta))" }}>
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ─── StreakDetail ─────────────────────────────────────────────────────────────

const StreakDetail = memo(function StreakDetail({
    current,
    longest,
    bothSentToday,
    waitingForPartner,
    atRisk,
    activeDays,
    restoresLeft,
    onRestore,
    onClose,
}: {
    current: number;
    longest: number;
    bothSentToday: boolean;
    waitingForPartner: boolean;
    atRisk: boolean;
    activeDays: string[];
    restoresLeft: number;
    onRestore: () => void;
    onClose: () => void;
}) {
    const isLit = current > 0 && !atRisk;
    const statusText = getStatusText(atRisk, bothSentToday, waitingForPartner, current);
    const statusColor = getStatusColor(atRisk, bothSentToday, waitingForPartner);

    return (
        <div
            role="dialog"
            aria-label="Streak details"
            className={cn(
                "absolute top-full left-0 mt-2 z-50 w-56",
                "rounded-2xl border border-border shadow-xl p-4",
                "animate-in fade-in slide-in-from-top-1 duration-150",
            )}
            style={{ background: "hsl(var(--wa-header))" }}
        >
            {/* Flame + count */}
            <div className="flex flex-col items-center gap-1 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    <Flame
                        size={30}
                        aria-hidden
                        className={cn(isLit ? "text-orange-500 flame-lit" : "text-muted-foreground")}
                    />
                    <span
                        className="text-3xl font-black tabular-nums"
                        style={{ color: isLit ? "#f97316" : "hsl(var(--wa-meta))" }}
                    >
                        {current}
                    </span>
                </div>
                <span className="text-xs font-medium" style={{ color: "hsl(var(--wa-meta))" }}>
                    day streak
                </span>
                <span className="text-[11px] font-semibold mt-0.5" style={{ color: statusColor }}>
                    {statusText}
                </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 pt-3">
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-muted/40">
                    <span className="text-base font-black tabular-nums" style={{ color: "hsl(var(--wa-text))" }}>
                        {current}
                    </span>
                    <span className="text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>current</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-muted/40">
                    <span className="text-base font-black tabular-nums" style={{ color: "hsl(var(--wa-text))" }}>
                        {longest}
                    </span>
                    <span className="text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>best ever</span>
                </div>
            </div>

            {/* Restore button — only when streak is at risk */}
            {atRisk && restoresLeft > 0 && (
                <button
                    type="button"
                    onClick={onRestore}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                        background: "hsl(var(--wa-online) / 0.12)",
                        color: "hsl(var(--wa-online))",
                    }}
                >
                    <RotateCcw size={13} aria-hidden />
                    Restore streak · {restoresLeft} left this month
                </button>
            )}
            {atRisk && restoresLeft === 0 && (
                <p className="text-center text-[10px] mt-3" style={{ color: "hsl(var(--wa-meta))" }}>
                    No restores left this month
                </p>
            )}

            {/* 7-day calendar dots */}
            <StreakCalendarRow activeDays={activeDays} />

            {/* Next milestone progress */}
            {current > 0 && <NextMilestoneHint current={current} />}

            {/* Close */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-muted/40 transition-colors"
                style={{ color: "hsl(var(--wa-meta))" }}
            >
                <X size={12} />
            </button>
        </div>
    );
});

// ─── StreakBadge ──────────────────────────────────────────────────────────────

interface StreakBadgeProps {
    /** Colour for the count text when streak is unlit — matches active chat theme */
    metaColor?: string;
}

export const StreakBadge = memo(function StreakBadge({ metaColor }: StreakBadgeProps) {
    const {
        current,
        longest,
        bothSentToday,
        waitingForPartner,
        atRisk,
        milestone,
        activeDays,
        isLoading,
    } = useMessageStreak();

    const { restoresLeft, consumeRestore } = useMonthlyRestores();

    const [showToast, setShowToast] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const prevMilestone = useRef<number | null>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    // Show milestone toast exactly once per newly reached milestone
    useEffect(() => {
        if (milestone && milestone !== prevMilestone.current) {
            prevMilestone.current = milestone;
            setShowToast(true);
        }
    }, [milestone]);

    // Close detail popover on outside click
    useEffect(() => {
        if (!showDetail) return;
        const handler = (e: MouseEvent) => {
            if (detailRef.current && !detailRef.current.contains(e.target as Node)) {
                setShowDetail(false);
            }
        };
        const tid = setTimeout(() => document.addEventListener("mousedown", handler), 50);
        return () => { clearTimeout(tid); document.removeEventListener("mousedown", handler); };
    }, [showDetail]);

    // FIX: useCallback must be declared BEFORE any early return — Rules of Hooks.
    // Previously this was below the `if (isLoading || ...)` guard which caused
    // "Rendered more hooks than during the previous render" on re-renders.
    const handleRestore = useCallback(() => {
        consumeRestore();
        // TODO: call your Supabase edge function here to persist the restore server-side
        // e.g. supabase.functions.invoke("restore-streak", { body: { coupleId } })
    }, [consumeRestore]);

    // Don't render while loading or when streak is 0 with no at-risk state
    if (isLoading || (current === 0 && !atRisk)) return null;

    const isLit = current > 0 && !atRisk;

    const ariaLabel = atRisk
        ? "Streak at risk — tap to restore"
        : bothSentToday
            ? `${current}-day streak — both sent today`
            : waitingForPartner
                ? `${current}-day streak — waiting for partner`
                : `${current}-day streak`;

    return (
        <div className="relative flex items-center" ref={detailRef}>

            {/* ── Badge button ── */}
            <button
                type="button"
                onClick={() => setShowDetail(d => !d)}
                aria-label={ariaLabel}
                aria-expanded={showDetail}
                className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all",
                    "hover:bg-orange-500/10 active:scale-95",
                    atRisk && "animate-pulse",
                )}
            >
                <Flame
                    size={14}
                    aria-hidden
                    className={cn(isLit ? "text-orange-500 flame-lit" : "text-muted-foreground")}
                />
                <span
                    className="text-[11px] font-bold tabular-nums leading-none"
                    style={{ color: isLit ? "#f97316" : metaColor ?? "hsl(var(--wa-meta))" }}
                >
                    {current}
                </span>
                {/* Red dot = at risk */}
                {atRisk && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />
                )}
                {/* Green dot = both sent today */}
                {bothSentToday && !atRisk && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" aria-hidden />
                )}
            </button>

            {/* ── Milestone toast ── */}
            {showToast && milestone && (
                <MilestoneToast
                    milestone={milestone}
                    onDismiss={() => setShowToast(false)}
                />
            )}

            {/* ── Detail popover ── */}
            {showDetail && (
                <StreakDetail
                    current={current}
                    longest={longest}
                    bothSentToday={bothSentToday}
                    waitingForPartner={waitingForPartner}
                    atRisk={atRisk}
                    activeDays={activeDays}
                    restoresLeft={restoresLeft}
                    onRestore={handleRestore}
                    onClose={() => setShowDetail(false)}
                />
            )}
        </div>
    );
});

export default StreakBadge;