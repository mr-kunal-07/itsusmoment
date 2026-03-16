import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Flame, Hourglass, RotateCcw, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessageStreak } from "./Usemessagestreak";

// ─── Flame animation ──────────────────────────────────────────────────────────

if (typeof document !== "undefined" && !document.getElementById("streak-flame-style")) {
    const s = document.createElement("style");
    s.id = "streak-flame-style";
    s.innerHTML = `
    @keyframes flameFlicker {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.12); }
      100% { transform: scale(1); }
    }
    @keyframes hourglassTilt {
      0%, 100% { transform: rotate(0deg); }
      25%       { transform: rotate(-15deg); }
      75%       { transform: rotate(15deg); }
    }
    .flame-lit    { animation: flameFlicker 1.4s ease-in-out infinite; }
    .hourglass-anim { animation: hourglassTilt 2s ease-in-out infinite; }
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
const MILESTONE_DAYS = MILESTONES.map((m) => m.days);
const MONTHLY_RESTORE_LIMIT = 3;

// ─── Monthly restore (localStorage, UX-level only) ────────────────────────────

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
        } catch { /* storage unavailable */ }
        return { month: currentMonth, used: 0 };
    });

    useEffect(() => {
        if (data.month !== currentMonth) {
            const reset = { month: currentMonth, used: 0 };
            setData(reset);
            try { localStorage.setItem(RESTORE_KEY, JSON.stringify(reset)); } catch { /* ignore */ }
        }
    }, [currentMonth, data.month]);

    const consumeRestore = useCallback(() => {
        setData((prev) => {
            if (prev.used >= MONTHLY_RESTORE_LIMIT) return prev;
            const next = { ...prev, used: prev.used + 1 };
            try { localStorage.setItem(RESTORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
        // TODO: call Supabase edge function to enforce server-side:
        // supabase.functions.invoke("restore-streak", { body: { coupleId } })
    }, []);

    return { restoresLeft: Math.max(0, MONTHLY_RESTORE_LIMIT - data.used), consumeRestore };
}

// ─── Milestone toast — persisted so it only ever fires once per milestone ─────

const DISMISSED_KEY = "streak_milestones_seen";
function getDismissed(): Set<number> {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]")); }
    catch { return new Set(); }
}
function persistDismissed(set: Set<number>) {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format ms → "3h 42m" or "45m" or "< 1m" */
function formatTimeLeft(ms: number): string {
    const totalMinutes = Math.floor(ms / 60_000);
    if (totalMinutes <= 0) return "< 1m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function getStatusText(
    iSent: boolean,
    partnerSent: boolean,
    atRisk: boolean,
    bothSent: boolean,
    waitingForPartner: boolean,
    neitherSent: boolean,
    current: number,
    timeLeftMs: number | null,
): string {
    if (current === 0 && neitherSent) return "Send a message to start your streak";
    if (bothSent) return "Both of you sent today ✓";
    if (atRisk && waitingForPartner) {
        const t = timeLeftMs != null ? ` · ${formatTimeLeft(timeLeftMs)} left` : "";
        return `Waiting for partner${t}`;
    }
    if (atRisk && neitherSent) {
        const t = timeLeftMs != null ? ` · ${formatTimeLeft(timeLeftMs)} left` : "";
        return `Send now to save it${t}`;
    }
    if (atRisk) return "Streak at risk!";
    if (waitingForPartner) return "Waiting for partner";
    if (!iSent && current > 0) return "Send a message to keep it going";
    return "Keep it going!";
}

function getStatusColor(atRisk: boolean, bothSent: boolean, waitingForPartner: boolean): string {
    if (atRisk) return "#ef4444";
    if (bothSent) return "#22c55e";
    if (waitingForPartner) return "#f97316";
    return "#6b7280";
}

function getNextMilestone(current: number): number | null {
    return MILESTONE_DAYS.find((d) => d > current) ?? null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const MilestoneToast = memo(function MilestoneToast({
    milestone, onDismiss,
}: { milestone: number; onDismiss: () => void }) {
    const info = MILESTONES.find((m) => m.days === milestone);

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

const NextMilestoneHint = memo(function NextMilestoneHint({ current }: { current: number }) {
    const next = getNextMilestone(current);
    if (!next) return null;
    const daysLeft = next - current;
    const pct = Math.round((current / next) * 100);
    const info = MILESTONES.find((m) => m.days === next);

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

const StreakCalendarRow = memo(function StreakCalendarRow({ activeDays }: { activeDays: string[] }) {
    const days = useMemo(() => {
        const activeSet = new Set(activeDays);
        // FIX: use local-timezone date formatting (not .toISOString which is UTC)
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            // Pad manually to avoid UTC drift from .toISOString()
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const key = `${y}-${m}-${day}`;
            const label = d.toLocaleDateString("en", { weekday: "narrow" });
            return { key, label, active: activeSet.has(key) };
        });
    }, [activeDays]);

    return (
        <div className="mt-3 pt-3 border-t border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(var(--wa-meta))" }}>
                Last 7 days
            </p>
            <div className="flex items-end justify-between gap-1">
                {days.map((day) => (
                    <div key={day.key} className="flex flex-col items-center gap-1">
                        <div
                            className={cn("h-2.5 w-2.5 rounded-full transition-colors", day.active ? "bg-orange-500" : "bg-muted/60")}
                            aria-label={`${day.label}: ${day.active ? "sent" : "no message"}`}
                        />
                        <span className="text-[9px]" style={{ color: "hsl(var(--wa-meta))" }}>{day.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ─── Countdown timer display ──────────────────────────────────────────────────

const WindowCountdown = memo(function WindowCountdown({
    timeLeftMs, atRisk,
}: { timeLeftMs: number; atRisk: boolean }) {
    // Fine-grained live tick (every second when < 5min, every 30s otherwise)
    const [_, setTick] = useState(0);
    useEffect(() => {
        const interval = timeLeftMs < 5 * 60_000 ? 1_000 : 30_000;
        const id = setInterval(() => setTick((n) => n + 1), interval);
        return () => clearInterval(id);
    }, [timeLeftMs]);

    return (
        <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg mt-2"
            style={{ background: atRisk ? "hsl(0 80% 60% / 0.10)" : "hsl(var(--wa-system-bubble))" }}
        >
            <Clock size={11} style={{ color: atRisk ? "#ef4444" : "hsl(var(--wa-meta))" }} aria-hidden />
            <span
                className="text-[10px] font-semibold tabular-nums"
                style={{ color: atRisk ? "#ef4444" : "hsl(var(--wa-meta))" }}
            >
                {formatTimeLeft(timeLeftMs)} left in window
            </span>
        </div>
    );
});

// ─── SendStatus — shows who has sent in the current window ───────────────────

const SendStatus = memo(function SendStatus({
    iSent, partnerSent,
}: { iSent: boolean; partnerSent: boolean }) {
    const dot = (sent: boolean, label: string) => (
        <div className="flex flex-col items-center gap-0.5">
            <div
                className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                    sent
                        ? "bg-orange-500 text-white scale-110"
                        : "bg-muted/50 text-muted-foreground",
                )}
                aria-label={`${label}: ${sent ? "sent" : "not sent yet"}`}
            >
                {sent ? "✓" : "–"}
            </div>
            <span className="text-[9px]" style={{ color: "hsl(var(--wa-meta))" }}>{label}</span>
        </div>
    );

    return (
        <div className="flex items-center justify-center gap-4 py-2">
            {dot(iSent, "You")}
            <span className="text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>+</span>
            {dot(partnerSent, "Partner")}
        </div>
    );
});

// ─── StreakDetail popover ─────────────────────────────────────────────────────

const StreakDetail = memo(function StreakDetail({
    current, longest,
    iSent, partnerSent, bothSent, waitingForPartner, neitherSent,
    atRisk, timeLeftMs, activeDays,
    restoresLeft, onRestore, onClose,
}: {
    current: number;
    longest: number;
    iSent: boolean;
    partnerSent: boolean;
    bothSent: boolean;
    waitingForPartner: boolean;
    neitherSent: boolean;
    atRisk: boolean;
    timeLeftMs: number | null;
    activeDays: string[];
    restoresLeft: number;
    onRestore: () => void;
    onClose: () => void;
}) {
    const isLit = current > 0 && !atRisk;
    const statusText = getStatusText(iSent, partnerSent, atRisk, bothSent, waitingForPartner, neitherSent, current, timeLeftMs);
    const statusColor = getStatusColor(atRisk, bothSent, waitingForPartner);

    return (
        <div
            role="dialog"
            aria-label="Streak details"
            className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 z-50",
                "w-[90vw] max-w-[260px] sm:w-64",
                "rounded-2xl border border-border shadow-xl p-3 sm:p-4",
                "animate-in fade-in slide-in-from-top-1 duration-150",
            )}
            style={{ background: "hsl(var(--wa-header))" }}
        >
            {/* Flame + count */}
            <div className="flex flex-col items-center gap-1 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                    {atRisk ? (
                        <Hourglass size={28} className="hourglass-anim" style={{ color: "#ef4444" }} aria-hidden />
                    ) : (
                        <Flame size={28} className={cn(isLit ? "text-orange-500 flame-lit" : "text-muted-foreground")} aria-hidden />
                    )}
                    <span
                        className="text-2xl sm:text-3xl font-black tabular-nums"
                        style={{ color: isLit ? "#f97316" : atRisk ? "#ef4444" : "hsl(var(--wa-meta))" }}
                    >
                        {current}
                    </span>
                </div>
                <span className="text-[11px] sm:text-xs font-medium" style={{ color: "hsl(var(--wa-meta))" }}>
                    day streak
                </span>
                <span
                    className="text-[10px] sm:text-[11px] font-semibold mt-0.5 text-center"
                    style={{ color: statusColor }}
                >
                    {statusText}
                </span>

                {/* Live countdown when window is open */}
                {timeLeftMs !== null && timeLeftMs > 0 && !bothSent && (
                    <WindowCountdown timeLeftMs={timeLeftMs} atRisk={atRisk} />
                )}
            </div>


            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 pt-3">
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-muted/40">
                    <span className="text-sm sm:text-base font-black tabular-nums" style={{ color: "hsl(var(--wa-text))" }}>
                        {current}
                    </span>
                    <span className="text-[9px] sm:text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>current</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-muted/40">
                    <span className="text-sm sm:text-base font-black tabular-nums" style={{ color: "hsl(var(--wa-text))" }}>
                        {longest}
                    </span>
                    <span className="text-[9px] sm:text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>best ever</span>
                </div>
            </div>

            {/* Restore button — only shown when atRisk */}
            {atRisk && restoresLeft > 0 && (
                <button
                    type="button"
                    onClick={onRestore}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{ background: "hsl(var(--wa-online) / 0.12)", color: "hsl(var(--wa-online))" }}
                >
                    <RotateCcw size={14} aria-hidden />
                    Restore streak · {restoresLeft} left this month
                </button>
            )}
            {atRisk && restoresLeft === 0 && (
                <p className="text-center text-[10px] mt-3" style={{ color: "hsl(var(--wa-meta))" }}>
                    No restores left this month
                </p>
            )}

            {/* 7-day calendar */}
            <div className="mt-3 overflow-x-auto">
                <StreakCalendarRow activeDays={activeDays} />
            </div>

            {/* Next milestone */}
            {current > 0 && (
                <div className="mt-3">
                    <NextMilestoneHint current={current} />
                </div>
            )}

            {/* Close */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/40 transition-colors"
                style={{ color: "hsl(var(--wa-meta))" }}
            >
                <X size={14} />
            </button>
        </div>
    );
});

// ─── StreakBadge ──────────────────────────────────────────────────────────────

interface StreakBadgeProps {
    metaColor?: string;
}

export const StreakBadge = memo(function StreakBadge({ metaColor }: StreakBadgeProps) {
    const {
        current, longest,
        iSent, partnerSent, bothSent, waitingForPartner, neitherSent,
        atRisk, timeLeftMs, windowExpiresAt,
        milestone, activeDays, isLoading,
    } = useMessageStreak();

    const { restoresLeft, consumeRestore } = useMonthlyRestores();
    const [showToast, setShowToast] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);

    // ── Milestone toast — fires ONCE per milestone, ever ──────────────────────
    useEffect(() => {
        if (!milestone) return;
        const dismissed = getDismissed();
        if (!dismissed.has(milestone)) {
            setShowToast(true);
            dismissed.add(milestone);
            persistDismissed(dismissed);
        }
    }, [milestone]);

    // ── Close detail on outside pointer ───────────────────────────────────────
    useEffect(() => {
        if (!showDetail) return;
        const handler = (e: PointerEvent) => {
            const path = e.composedPath();
            if (detailRef.current && !path.includes(detailRef.current)) setShowDetail(false);
        };
        const tid = setTimeout(() => document.addEventListener("pointerdown", handler), 50);
        return () => { clearTimeout(tid); document.removeEventListener("pointerdown", handler); };
    }, [showDetail]);

    const handleRestore = useCallback(() => {
        consumeRestore();
        // TODO: wire to Supabase edge function for server-side enforcement
    }, [consumeRestore]);

    // Don't render while loading or no streak activity yet
    if (isLoading || (current === 0 && !atRisk && neitherSent)) return null;

    const isLit = current > 0 && !atRisk;

    const ariaLabel = atRisk
        ? `Streak at risk — ${timeLeftMs != null ? formatTimeLeft(timeLeftMs) : "unknown time"} left`
        : bothSent
            ? `${current}-day streak — both sent`
            : waitingForPartner
                ? `${current}-day streak — waiting for partner`
                : `${current}-day streak`;

    return (
        <div
            className="relative flex items-center"
            ref={detailRef}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {/* ── Badge button ────────────────────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => setShowDetail((d) => !d)}
                aria-label={ariaLabel}
                aria-expanded={showDetail}
                className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all",
                    "hover:bg-orange-500/10 active:scale-95",
                    atRisk && "animate-pulse",
                )}
            >
                {/* Icon: hourglass when at risk, flame otherwise */}
                {atRisk ? (
                    <Hourglass size={14} className="hourglass-anim" style={{ color: "#ef4444" }} aria-hidden />
                ) : (
                    <Flame
                        size={14}
                        aria-hidden
                        className={cn(isLit ? "text-orange-500 flame-lit" : "text-muted-foreground")}
                    />
                )}

                <span
                    className="text-[11px] font-bold tabular-nums leading-none"
                    style={{ color: atRisk ? "#ef4444" : isLit ? "#f97316" : metaColor ?? "hsl(var(--wa-meta))" }}
                >
                    {current}
                </span>

                {/* Status dot */}
                {atRisk && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />
                )}
                {bothSent && !atRisk && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" aria-hidden />
                )}
                {waitingForPartner && !atRisk && (
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" aria-hidden />
                )}
            </button>

            {/* ── Milestone toast ─────────────────────────────────────────────────── */}
            {showToast && milestone && (
                <MilestoneToast milestone={milestone} onDismiss={() => setShowToast(false)} />
            )}

            {/* ── Detail popover ──────────────────────────────────────────────────── */}
            {showDetail && (
                <StreakDetail
                    current={current}
                    longest={longest}
                    iSent={iSent}
                    partnerSent={partnerSent}
                    bothSent={bothSent}
                    waitingForPartner={waitingForPartner}
                    neitherSent={neitherSent}
                    atRisk={atRisk}
                    timeLeftMs={timeLeftMs}
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