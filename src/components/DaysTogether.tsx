import { useState } from "react";
import { Heart, CalendarDays, Pencil } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { useMilestones, useAddMilestone, useUpdateMilestone } from "@/hooks/useMilestones";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function DaysTogether() {
  const { user } = useAuth();
  const { data: milestones = [] } = useMilestones();
  const addMilestone = useAddMilestone();
  const updateMilestone = useUpdateMilestone();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState("");

  // Find the "Together Since" milestone
  const startMilestone = milestones.find(
    m => m.type === "anniversary" && m.title === "Together Since"
  );

  const days = startMilestone
    ? differenceInDays(new Date(), parseISO(startMilestone.date))
    : null;

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
    <div className="border-t border-sidebar-border pt-3 mt-1">
      {days !== null && startMilestone ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="w-full text-left group">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Together since {format(parseISO(startMilestone.date), "MMM d, yyyy")}
                </span>
                <Pencil className="h-2.5 w-2.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <Heart className="h-3.5 w-3.5 text-primary fill-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground">{days.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">days together</span>
                </div>
              </div>
              <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((days / 3650) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground/50 mt-0.5 text-right">
                {(days / 365).toFixed(1)} years
              </p>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64 p-3 space-y-3">
            <p className="text-xs font-medium">Change start date</p>
            <Input
              type="date"
              defaultValue={startMilestone.date}
              onChange={e => setDateInput(e.target.value)}
              className="h-8 text-sm"
            />
            <Button size="sm" className="w-full" onClick={handleSave} disabled={addMilestone.isPending || updateMilestone.isPending}>
              Save
            </Button>
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-2 text-left group hover:opacity-80 transition-opacity">
              <Heart className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground">Set your start date</p>
                <p className="text-[10px] text-muted-foreground/50">When did your story begin? 💕</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64 p-3 space-y-3">
            <p className="text-xs font-medium">When did you get together? 💕</p>
            <Input
              type="date"
              onChange={e => setDateInput(e.target.value)}
              className="h-8 text-sm"
              max={new Date().toISOString().split("T")[0]}
            />
            <Button size="sm" className="w-full gap-1.5" onClick={handleSave} disabled={!dateInput || addMilestone.isPending}>
              <Heart className="h-3.5 w-3.5" /> Set Start Date
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
