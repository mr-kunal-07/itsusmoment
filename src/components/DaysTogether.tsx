import { useState } from "react";
import { Heart, CalendarDays, Pencil, Sparkles } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { useMilestones, useAddMilestone, useUpdateMilestone } from "@/hooks/useMilestones";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Cream palette
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
};

export function DaysTogether() {
  const { user } = useAuth();
  const { data: milestones = [] } = useMilestones();
  const addMilestone = useAddMilestone();
  const updateMilestone = useUpdateMilestone();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState("");

  const startMilestone = milestones.find(
    m => m.type === "anniversary" && m.title === "Together Since"
  );

  const days = startMilestone
    ? differenceInDays(new Date(), parseISO(startMilestone.date))
    : null;

  const years = days ? days / 365 : 0;
  const progressPct = Math.min((days ?? 0) / 3650 * 100, 100);

  const handleSave = async () => {
    if (!dateInput) return;
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
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  return (
    <div className="mt-1">
      {days !== null && startMilestone ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-full text-left group rounded-xl px-3 py-2.5 transition-all"
              style={{ background: C.bg, border: `1px solid ${C.border}` }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5" style={{ color: C.label }}>
                  <CalendarDays className="h-3 w-3" />
                  <span className="text-[10px] font-medium">
                    Together since {format(parseISO(startMilestone.date), "MMM d, yyyy")}
                  </span>
                </span>
                <Pencil
                  className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: C.pencil }}
                />
              </div>

              {/* Count */}
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: C.iconBg, boxShadow: C.iconShadow }}
                >
                  <Heart className="h-4 w-4 fill-current" style={{ color: C.num }} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight leading-none" style={{ color: C.num }}>
                    {days.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: C.label }}>
                    days together
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: C.trackBg }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: C.trackFill }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px]" style={{ color: C.meta }}>0</span>
                <span className="text-[9px] font-medium flex items-center gap-0.5" style={{ color: C.label }}>
                  <Sparkles className="h-2 w-2" />
                  {years.toFixed(1)} yrs
                </span>
                <span className="text-[9px]" style={{ color: C.meta }}>10yr</span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64 p-3 space-y-3">
            <p className="text-xs font-medium">Change start date</p>
            <Input type="date" defaultValue={startMilestone.date} onChange={e => setDateInput(e.target.value)} className="h-8 text-sm" />
            <Button size="sm" className="w-full" onClick={handleSave} disabled={addMilestone.isPending || updateMilestone.isPending}>
              Save
            </Button>
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-full flex items-center gap-2.5 text-left rounded-xl px-3 py-2.5 group hover:opacity-90 transition-opacity"
              style={{ background: C.bg, border: `1px solid ${C.border}` }}
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.iconBg }}>
                <Heart className="h-4 w-4" style={{ color: C.num }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: C.num }}>Set your start date</p>
                <p className="text-[10px]" style={{ color: C.label }}>When did your story begin? 💕</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64 p-3 space-y-3">
            <p className="text-xs font-medium">When did you get together? 💕</p>
            <Input type="date" onChange={e => setDateInput(e.target.value)} className="h-8 text-sm" max={new Date().toISOString().split("T")[0]} />
            <Button size="sm" className="w-full gap-1.5" onClick={handleSave} disabled={!dateInput || addMilestone.isPending}>
              <Heart className="h-3.5 w-3.5" /> Set Start Date
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
