import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay, addYears, startOfDay } from "date-fns";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Milestone } from "@/hooks/useMilestones";
import { getPublicUrl } from "@/hooks/useMedia";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  milestones: Milestone[];
  mediaMap: Record<string, { file_path: string; title: string }>;
}

/** For anniversaries, get the date they fall on in a given year */
function anniversaryDateInYear(milestoneDate: string, year: number): Date {
  const d = new Date(milestoneDate);
  return new Date(year, d.getMonth(), d.getDate());
}

/** Get all dates a milestone should be marked on (for the visible range) */
function getMilestoneDates(milestones: Milestone[], year: number, month: number) {
  const anniversaryDates: Date[] = [];
  const milestoneDates: Date[] = [];

  // Build prev/current/next month range to cover full display
  for (const m of milestones) {
    if (m.type === "anniversary") {
      // Show anniversary dot on this year's occurrence in the displayed month
      [-1, 0, 1].forEach(offset => {
        const d = anniversaryDateInYear(m.date, year + offset);
        if (d.getMonth() === month) anniversaryDates.push(d);
      });
    } else {
      milestoneDates.push(new Date(m.date));
    }
  }
  return { anniversaryDates, milestoneDates };
}

function getMilestonesForDay(milestones: Milestone[], day: Date): Milestone[] {
  return milestones.filter(m => {
    if (m.type === "anniversary") {
      const d = new Date(m.date);
      return d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    }
    return isSameDay(new Date(m.date), day);
  });
}

export function MilestoneCalendar({ milestones, mediaMap }: Props) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | undefined>();

  const { anniversaryDates, milestoneDates } = getMilestoneDates(
    milestones,
    month.getFullYear(),
    month.getMonth()
  );

  const selectedMilestones = selected ? getMilestonesForDay(milestones, selected) : [];

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="glass-card rounded-2xl p-4">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          className="pointer-events-auto w-full"
          classNames={{
            months: "flex flex-col",
            month: "space-y-3 w-full",
            caption: "flex justify-center relative items-center mb-1",
            caption_label: "text-sm font-semibold font-heading",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "ghost" }),
              "h-7 w-7 p-0 opacity-60 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.75rem] text-center py-1",
            row: "flex w-full mt-1",
            cell: "relative flex-1 text-center text-sm p-0 focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "w-full h-10 p-0 font-normal mx-auto flex flex-col items-center justify-center rounded-xl aria-selected:opacity-100 hover:bg-accent"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-xl",
            day_today: "bg-accent/50 text-accent-foreground font-semibold",
            day_outside: "text-muted-foreground opacity-30",
            day_disabled: "text-muted-foreground opacity-30",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
            DayContent: ({ date }) => {
              const hasAnniversary = anniversaryDates.some(d => isSameDay(d, date));
              const hasMilestone = milestoneDates.some(d => isSameDay(d, date));
              return (
                <span className="flex flex-col items-center gap-0.5">
                  <span>{date.getDate()}</span>
                  {(hasAnniversary || hasMilestone) && (
                    <span className="flex gap-0.5">
                      {hasAnniversary && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                      {hasMilestone && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                    </span>
                  )}
                </span>
              );
            },
          }}
          modifiers={{
            anniversary: anniversaryDates,
            milestone: milestoneDates,
          }}
        />

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 pt-3 border-t border-border/50 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Anniversary
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Milestone
          </span>
        </div>
      </div>

      {/* Selected day panel */}
      {selected && selectedMilestones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {format(selected, "EEEE, MMMM d")}
          </p>
          {selectedMilestones.map(m => {
            const photo = m.media_id ? mediaMap[m.media_id] : null;
            const isAnniversary = m.type === "anniversary";
            const original = new Date(m.date);
            const yearsAgo = selected.getFullYear() - original.getFullYear();

            return (
              <div key={m.id} className="glass-card rounded-xl p-4 flex gap-3">
                {photo ? (
                  <img
                    src={getPublicUrl(photo.file_path)}
                    alt={photo.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center shrink-0 text-xl",
                    isAnniversary ? "bg-primary/10" : "bg-amber-500/10"
                  )}>
                    {isAnniversary ? "💑" : "⭐"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold font-heading text-sm">{m.title}</p>
                    {isAnniversary && yearsAgo > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {yearsAgo === 1 ? "1st" : yearsAgo === 2 ? "2nd" : yearsAgo === 3 ? "3rd" : `${yearsAgo}th`} Anniversary
                      </Badge>
                    )}
                    {isAnniversary && yearsAgo === 0 && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                        <Heart className="h-2.5 w-2.5 mr-1 fill-current" /> This year!
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(original, "MMMM d, yyyy")}
                    {isAnniversary && yearsAgo > 0 && (
                      <span className="ml-2 text-muted-foreground/60">· {yearsAgo} year{yearsAgo !== 1 ? "s" : ""} ago</span>
                    )}
                  </p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && selectedMilestones.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No milestones on {format(selected, "MMMM d")}
        </div>
      )}
    </div>
  );
}
