import { useState } from "react";
import { useMilestones, useAddMilestone, useDeleteMilestone, Milestone } from "@/hooks/useMilestones";
import { useMedia, getPublicUrl } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, addYears, isAfter, startOfDay } from "date-fns";
import { Plus, Trash2, Heart, Star, Calendar as CalendarIcon, Clock, Image, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { MilestoneCalendar } from "@/components/MilestoneCalendar";

function getNextOccurrence(dateStr: string): Date {
  const now = startOfDay(new Date());
  const d = new Date(dateStr);
  let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (!isAfter(next, now)) next = addYears(next, 1);
  return next;
}

function daysUntil(dateStr: string): number {
  return differenceInDays(getNextOccurrence(dateStr), startOfDay(new Date()));
}

/** Circular countdown ring */
function CountdownRing({ days }: { days: number }) {
  const max = 365;
  const pct = Math.max(0, Math.min(1, 1 - days / max));
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  const urgent = days === 0;
  const soon = days <= 7;
  const near = days <= 30;

  const ringColor = urgent ? "hsl(var(--primary))" : soon ? "#f87171" : near ? "#fbbf24" : "hsl(var(--muted-foreground))";
  const textColor = urgent ? "text-primary" : soon ? "text-rose-400" : near ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={ringColor} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className={cn("absolute inset-0 flex flex-col items-center justify-center", textColor)}>
        {urgent ? (
          <Heart className="h-4 w-4 fill-current" />
        ) : (
          <>
            <span className="text-[11px] font-bold leading-none">{days}</span>
            <span className="text-[8px] opacity-70 leading-none mt-0.5">days</span>
          </>
        )}
      </div>
    </div>
  );
}

interface AddForm {
  title: string;
  date: string;
  description: string;
  type: "anniversary" | "milestone";
  media_id: string | null;
}

const defaultForm: AddForm = { title: "", date: "", description: "", type: "milestone", media_id: null };

export function AnniversariesView() {
  const { user } = useAuth();
  const { data: milestones = [], isLoading } = useMilestones();
  const { data: allMedia = [] } = useMedia();
  const addMilestone = useAddMilestone();
  const deleteMilestone = useDeleteMilestone();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>(defaultForm);
  const [pickMedia, setPickMedia] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const anniversaries = milestones
    .filter(m => m.type === "anniversary")
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  const milestoneList = milestones
    .filter(m => m.type === "milestone")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mediaMap = Object.fromEntries(allMedia.map(x => [x.id, x]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    await addMilestone.mutateAsync({ ...form, description: form.description || undefined, media_id: form.media_id });
    setForm(defaultForm);
    setShowAdd(false);
  };

  const mediaImages = allMedia.filter(m => m.file_type === "image");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-heading gradient-text">Our Milestones</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Anniversaries, special moments &amp; countdowns</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-1 border border-border/50">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                viewMode === "list"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                viewMode === "calendar"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Calendar view"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            size="sm"
            className="gap-1.5 h-8 px-3 font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* ── Calendar view ── */}
      {viewMode === "calendar" && (
        <MilestoneCalendar milestones={milestones} mediaMap={mediaMap} />
      )}

      {/* ── List view ── */}
      {viewMode === "list" && (
        <div className="space-y-8">
          {/* Anniversaries */}
          {anniversaries.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Anniversaries
                </h3>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground/60">{anniversaries.length}</span>
              </div>
              <div className="space-y-2.5">
                {anniversaries.map(m => (
                  <AnniversaryCard
                    key={m.id}
                    milestone={m}
                    mediaMap={mediaMap}
                    onDelete={() => deleteMilestone.mutate(m.id)}
                    canDelete={m.created_by === user?.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Milestones */}
          {milestoneList.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                </div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Special Moments
                </h3>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground/60">{milestoneList.length}</span>
              </div>

              {/* Timeline */}
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-border/60" />
                <div className="space-y-3">
                  {milestoneList.map((m, i) => (
                    <MilestoneTimelineCard
                      key={m.id}
                      milestone={m}
                      mediaMap={mediaMap}
                      onDelete={() => deleteMilestone.mutate(m.id)}
                      canDelete={m.created_by === user?.id}
                      isLast={i === milestoneList.length - 1}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {!isLoading && milestones.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                <Heart className="h-7 w-7 text-primary/40" />
              </div>
              <div>
                <p className="font-semibold font-heading text-foreground">No milestones yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first anniversary or a special moment to remember.
                </p>
              </div>
              <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5 mt-1">
                <Plus className="h-3.5 w-3.5" /> Add your first milestone
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Add dialog ── */}
      <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) setDatePickerOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base">Add milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              {(["anniversary", "milestone"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={cn(
                    "py-2.5 px-3 rounded-lg text-sm font-medium border transition-all",
                    form.type === t
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {t === "anniversary" ? "💑 Anniversary" : "⭐ Milestone"}
                </button>
              ))}
            </div>

            <Input
              placeholder="Title (e.g. First Date, Proposal…)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />

            {/* Date picker */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" /> Date
              </label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-left transition-colors hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-ring",
                      !form.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
                    {form.date
                      ? format(new Date(form.date + "T00:00:00"), "MMMM d, yyyy")
                      : "Pick a date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date ? new Date(form.date + "T00:00:00") : undefined}
                    onSelect={d => {
                      if (d) {
                        setForm(f => ({ ...f, date: format(d, "yyyy-MM-dd") }));
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />

            {/* Attach photo */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Image className="h-3 w-3" /> Attach a photo
              </p>
              {form.media_id ? (
                <div className="relative w-20 h-20">
                  <img
                    src={getPublicUrl(allMedia.find(m => m.id === form.media_id)?.file_path ?? "")}
                    className="w-full h-full object-cover rounded-lg border border-border/50"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, media_id: null }))}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center shadow-sm"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickMedia(true)}
                  className="border border-dashed border-border/70 rounded-lg px-4 py-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors w-full"
                >
                  Pick from vault
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addMilestone.isPending}>
                {addMilestone.isPending ? "Saving…" : "Save milestone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Media picker ── */}
      <Dialog open={pickMedia} onOpenChange={setPickMedia}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pick a photo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
            {mediaImages.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setForm(f => ({ ...f, media_id: m.id })); setPickMedia(false); }}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                  form.media_id === m.id ? "border-primary" : "border-transparent"
                )}
              >
                <img src={getPublicUrl(m.file_path)} className="w-full h-full object-cover" />
              </button>
            ))}
            {mediaImages.length === 0 && (
              <p className="col-span-4 text-center text-sm text-muted-foreground py-8">No photos yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Anniversary card with countdown ring */
function AnniversaryCard({
  milestone, mediaMap, onDelete, canDelete,
}: {
  milestone: Milestone;
  mediaMap: Record<string, { file_path: string; title: string }>;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const days = daysUntil(milestone.date);
  const photo = milestone.media_id ? mediaMap[milestone.media_id] : null;
  const dateObj = new Date(milestone.date);
  const yearsAgo = new Date().getFullYear() - dateObj.getFullYear();
  const isToday = days === 0;

  return (
    <div className={cn(
      "group relative rounded-2xl border overflow-hidden transition-all hover:border-primary/30",
      isToday
        ? "border-primary/40 bg-primary/5"
        : "border-border/60 bg-card/60 backdrop-blur-sm"
    )}>
      {/* Shimmer on today */}
      {isToday && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse pointer-events-none" />
      )}

      <div className="flex items-stretch">
        {/* Photo strip */}
        {photo && (
          <div className="w-20 shrink-0">
            <img
              src={getPublicUrl(photo.file_path)}
              alt={photo.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 flex items-center gap-4 px-4 py-4 min-w-0">
          {/* Countdown ring */}
          <CountdownRing days={days} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold font-heading text-sm text-foreground truncate">{milestone.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(dateObj, "MMMM d")}
              {yearsAgo > 0 && (
                <span className="ml-2 text-muted-foreground/50">
                  · {yearsAgo} year{yearsAgo !== 1 ? "s" : ""} ago
                </span>
              )}
            </p>
            {milestone.description && (
              <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{milestone.description}</p>
            )}
          </div>

          {/* Label */}
          <div className="shrink-0 text-right">
            {isToday ? (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <Heart className="h-3 w-3 fill-current" /> Today!
              </span>
            ) : days <= 7 ? (
              <span className="text-xs font-medium text-rose-400">{days}d away</span>
            ) : days <= 30 ? (
              <span className="text-xs font-medium text-amber-400">{days}d away</span>
            ) : (
              <span className="text-xs text-muted-foreground">{days} days</span>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 block ml-auto h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Milestone on a vertical timeline */
function MilestoneTimelineCard({
  milestone, mediaMap, onDelete, canDelete, isLast,
}: {
  milestone: Milestone;
  mediaMap: Record<string, { file_path: string; title: string }>;
  onDelete: () => void;
  canDelete: boolean;
  isLast: boolean;
}) {
  const photo = milestone.media_id ? mediaMap[milestone.media_id] : null;
  const dateObj = new Date(milestone.date);

  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div className="absolute -left-6 top-4 flex flex-col items-center">
        <div className="h-2.5 w-2.5 rounded-full border-2 border-amber-400 bg-background z-10" />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden transition-all hover:border-amber-400/30 hover:bg-card/80">
        <div className="flex items-stretch">
          {/* Photo strip */}
          {photo && (
            <div className="w-16 shrink-0">
              <img
                src={getPublicUrl(photo.file_path)}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
            {!photo && (
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-base">
                ⭐
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold font-heading text-sm text-foreground truncate">{milestone.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Clock className="h-3 w-3 opacity-50" />
                {format(dateObj, "MMMM d, yyyy")}
              </p>
              {milestone.description && (
                <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{milestone.description}</p>
              )}
            </div>
            {canDelete && (
              <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
