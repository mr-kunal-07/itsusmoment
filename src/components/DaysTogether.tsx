import { useState, useCallback } from "react";
import { Heart, CalendarDays, Pencil, Sparkles } from "lucide-react";
import { differenceInDays, format, parseISO, isValid } from "date-fns";
import { useMilestones, useAddMilestone, useUpdateMilestone } from "@/hooks/useMilestones";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// ─── Golden palette ───────────────────────────────────────────────────────────
// Original warm-gold shades — always warm-toned like parchment regardless of
// light/dark mode. Applied via inline style for full colour fidelity.

const C = {
  bg: "linear-gradient(135deg, hsl(40 30% 88%) 0%, hsl(36 25% 82%) 100%)",
  border: "hsl(36 20% 70% / 0.6)",
  iconBg: "linear-gradient(135deg, hsl(36 25% 75%), hsl(30 20% 68%))",
  iconShadow: "0 0 10px hsl(36 25% 60% / 0.3)",
  num: "hsl(30 20% 28%)",
  label: "hsl(30 15% 42%)",
  meta: "hsl(30 12% 52%)",
  trackBg: "hsl(36 20% 75%)",
  trackFill: "linear-gradient(90deg, hsl(30 25% 48%), hsl(36 20% 58%))",
  pencil: "hsl(30 15% 50%)",
  btnBg: "linear-gradient(135deg, hsl(30 28% 44%), hsl(36 22% 52%))",
  inputFocus: "hsl(36 20% 60%)",
} as const;

const TEN_YEARS = 3650;

// ─── DaysTogether ─────────────────────────────────────────────────────────────

export function DaysTogether() {
  const { data: milestones = [] } = useMilestones();
  const addMilestone = useAddMilestone();
  const updateMilestone = useUpdateMilestone();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);

  const startMilestone = milestones.find(
    m => m.type === "anniversary" && m.title === "Together Since"
  );

  // Controlled — initialised from saved date, re-synced on popover open (Fix 1 & 4)
  const [dateInput, setDateInput] = useState(startMilestone?.date ?? "");

  // Validate saved date before computing (Fix 2)
  const parsedDate = startMilestone?.date ? parseISO(startMilestone.date) : null;
  const validDate = parsedDate && isValid(parsedDate) ? parsedDate : null;
  const days = validDate ? differenceInDays(new Date(), validDate) : null;
  // Fix 3: years only when days is a real number
  const years = days !== null ? days / 365 : 0;
  const progressPct = days !== null ? Math.min((days / TEN_YEARS) * 100, 100) : 0;
  const isPending = addMilestone.isPending || updateMilestone.isPending;

  // Re-sync input each time the popover opens (Fix 4)
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setDateInput(startMilestone?.date ?? "");
      setOpen(next);
    },
    [startMilestone?.date]
  );

  // Validate + guard before API call (Fix 5 & 6)
  const handleSave = useCallback(async () => {
    if (!dateInput || isPending) return;
    const parsed = parseISO(dateInput);
    if (!isValid(parsed) || parsed > new Date()) {
      toast({ title: "Invalid date", description: "Please pick a date in the past.", variant: "destructive" });
      return;
    }
    try {
      if (startMilestone) {
        await updateMilestone.mutateAsync({ id: startMilestone.id, date: dateInput });
      } else {
        await addMilestone.mutateAsync({
          title: "Together Since",
          date: dateInput,
          type: "anniversary",
          description: "The day our story began 💕",
        });
      }
      toast({ title: "💕 Start date saved!" });
      setOpen(false);
    } catch {
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
    }
  }, [dateInput, isPending, startMilestone, addMilestone, updateMilestone, toast]);

  return (
    <div className="mt-2 w-full">
      <Popover open={open} onOpenChange={handleOpenChange}>

        {/* ── Trigger ── */}
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              days !== null
                ? `${days.toLocaleString()} days together — tap to edit start date`
                : "Set your start date"
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            className="w-full text-left group rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              // Comfortable touch target — min 48px tall on mobile
              padding: "12px 14px",
            }}
          >
            {days !== null && validDate ? (
              <FilledView days={days} years={years} progressPct={progressPct} startDate={validDate} />
            ) : (
              <EmptyView />
            )}
          </button>
        </PopoverTrigger>

        {/* ── Popover ── */}
        <PopoverContent
          side="top"
          sideOffset={8}
          // Mobile: nearly full width; desktop: capped at 320px
          className="w-[min(90vw,320px)] p-0 overflow-hidden shadow-xl border-0"
          style={{ background: "hsl(40 30% 96%)", border: `1px solid ${C.border}` }}
        >
          {/* Header strip */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <p className="text-sm font-semibold" style={{ color: C.num }}>
              {days !== null ? "Change start date" : "When did you get together?"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.label }}>
              {days !== null
                ? "Update the day your story began"
                : "Set the date your love story started 💕"}
            </p>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-3">
            {/* Controlled date input (Fix 10) */}
            <Input
              type="date"
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="h-10 text-sm border-0 focus-visible:ring-1"
              style={{
                background: "hsl(40 25% 90%)",
                color: C.num,
                borderRadius: "0.5rem",
              }}
            />

            {/* Save button — golden, 3 states (Fix 6 & 11) */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!dateInput || isPending || dateInput === startMilestone?.date}
              className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: C.btnBg,
                color: "hsl(40 30% 95%)",
              }}
            >
              {isPending ? (
                <span
                  className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden
                />
              ) : (
                <Heart className="h-3.5 w-3.5 fill-current" aria-hidden />
              )}
              {startMilestone ? "Save Changes" : "Set Start Date"}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── FilledView ───────────────────────────────────────────────────────────────

function FilledView({
  days,
  years,
  progressPct,
  startDate,
}: {
  days: number;
  years: number;
  progressPct: number;
  startDate: Date;
}) {
  return (
    <>
      {/* Date label + pencil */}
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <span
          className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium leading-none truncate"
          style={{ color: C.label }}
        >
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
          Together since {format(startDate, "MMM d, yyyy")}
        </span>
        {/* Pencil only visible on hover (desktop) — Fix 12 */}
        <Pencil
          className="h-3 w-3 hidden sm:block opacity-0 group-hover:opacity-70 transition-opacity shrink-0"
          style={{ color: C.pencil }}
          aria-hidden
        />
      </div>

      {/* Icon + day count — bigger touch-friendly layout */}
      <div className="flex items-center gap-3 mb-3.5">
        <div
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: C.iconBg, boxShadow: C.iconShadow }}
        >
          <Heart
            className="h-5 w-5 fill-current"
            style={{ color: C.num }}
            aria-hidden
          />
        </div>

        <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
          <span
            className="text-xl sm:text-2xl font-extrabold leading-none tabular-nums"
            style={{ color: C.num }}
          >
            {days.toLocaleString()}
          </span>
          <span
            className="text-[11px] sm:text-xs font-medium"
            style={{ color: C.label }}
          >
            days together
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ background: C.trackBg }}
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${years.toFixed(1)} of 10 years together`}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%`, background: C.trackFill }}
        />
      </div>

      {/* Progress labels */}
      <div
        className="flex items-center justify-between mt-1.5 text-[10px] sm:text-[11px]"
        style={{ color: C.meta }}
      >
        <span>0</span>
        <span
          className="font-semibold flex items-center gap-0.5"
          style={{ color: C.label }}
        >
          <Sparkles className="h-2.5 w-2.5" aria-hidden />
          {years.toFixed(1)} yrs
        </span>
        <span>10yr</span>
      </div>
    </>
  );
}

// ─── EmptyView ────────────────────────────────────────────────────────────────

function EmptyView() {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: C.iconBg, boxShadow: C.iconShadow }}
      >
        <Heart className="h-5 w-5" style={{ color: C.num }} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: C.num }}>
          Set your start date
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: C.label }}>
          When did your story begin? 💕
        </p>
      </div>
    </div>
  );
}