import { useState } from "react";
import { useMilestones, useAddMilestone, useDeleteMilestone, Milestone } from "@/hooks/useMilestones";
import { useMedia, getPublicUrl } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

function CountdownBadge({ days }: { days: number }) {
  if (days === 0) return (
    <Badge className="bg-primary text-primary-foreground animate-pulse gap-1">
      <Heart className="h-3 w-3 fill-current" /> Today! 🎉
    </Badge>
  );
  if (days <= 7) return (
    <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 gap-1">
      <Clock className="h-3 w-3" /> {days}d away
    </Badge>
  );
  if (days <= 30) return (
    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{days} days</Badge>
  );
  return <Badge variant="secondary">{days} days</Badge>;
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

  const anniversaries = milestones.filter(m => m.type === "anniversary").sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const milestoneList = milestones.filter(m => m.type === "milestone").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading gradient-text">Our Milestones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Anniversaries, special moments & countdowns</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                viewMode === "calendar" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Calendar view"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add milestone
          </Button>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <MilestoneCalendar milestones={milestones} mediaMap={mediaMap} />
      )}

      {/* List view */}
      {viewMode === "list" && (
        <>
          {/* Anniversaries */}
          {anniversaries.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-primary fill-primary" />
                <h3 className="text-sm font-semibold font-heading uppercase tracking-wide text-muted-foreground">Anniversaries</h3>
              </div>
              <div className="grid gap-3">
                {anniversaries.map(m => (
                  <MilestoneCard key={m.id} milestone={m} mediaMap={mediaMap} onDelete={() => deleteMilestone.mutate(m.id)} canDelete={m.created_by === user?.id} />
                ))}
              </div>
            </section>
          )}

          {/* Milestones */}
          {milestoneList.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <h3 className="text-sm font-semibold font-heading uppercase tracking-wide text-muted-foreground">Special Moments</h3>
              </div>
              <div className="grid gap-3">
                {milestoneList.map(m => (
                  <MilestoneCard key={m.id} milestone={m} mediaMap={mediaMap} onDelete={() => deleteMilestone.mutate(m.id)} canDelete={m.created_by === user?.id} />
                ))}
              </div>
            </section>
          )}

          {!isLoading && milestones.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No milestones yet</p>
              <p className="text-sm mt-1">Add your first date anniversary or special moment!</p>
            </div>
          )}
        </>
      )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) setDatePickerOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Milestone</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["anniversary", "milestone"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={cn(
                    "py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors",
                    form.type === t
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {t === "anniversary" ? "💑 Anniversary" : "⭐ Milestone"}
                </button>
              ))}
            </div>
            <Input
              placeholder="Title (e.g. First Date, Proposal...)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
            {/* Date picker */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
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
                    {form.date ? format(new Date(form.date + "T00:00:00"), "MMMM d, yyyy") : "Pick a date"}
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
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Image className="h-3 w-3" /> Attach a photo</p>
              {form.media_id ? (
                <div className="relative w-20 h-20">
                  <img src={getPublicUrl(allMedia.find(m => m.id === form.media_id)?.file_path ?? "")} className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, media_id: null }))} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">×</button>
                </div>
              ) : (
                <button type="button" onClick={() => setPickMedia(true)} className="border-2 border-dashed border-border rounded-lg px-4 py-2.5 text-xs text-muted-foreground hover:border-primary/50 transition-colors w-full">
                  Pick from vault
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={addMilestone.isPending}>
                {addMilestone.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media picker dialog */}
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
                className={cn("aspect-square rounded-lg overflow-hidden border-2 transition-colors hover:border-primary", form.media_id === m.id ? "border-primary" : "border-transparent")}
              >
                <img src={getPublicUrl(m.file_path)} className="w-full h-full object-cover" />
              </button>
            ))}
            {mediaImages.length === 0 && <p className="col-span-4 text-center text-sm text-muted-foreground py-6">No photos yet</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MilestoneCard({ milestone, mediaMap, onDelete, canDelete }: {
  milestone: Milestone;
  mediaMap: Record<string, { file_path: string; title: string }>;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const days = milestone.type === "anniversary" ? daysUntil(milestone.date) : null;
  const photo = milestone.media_id ? mediaMap[milestone.media_id] : null;
  const isAnniversary = milestone.type === "anniversary";
  const dateObj = new Date(milestone.date);

  return (
    <div className="glass-card rounded-xl p-4 flex gap-4 group">
      {photo ? (
        <img src={getPublicUrl(photo.file_path)} alt={photo.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
      ) : (
        <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center shrink-0 text-2xl", isAnniversary ? "bg-primary/10" : "bg-amber-500/10")}>
          {isAnniversary ? "💑" : "⭐"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold font-heading text-sm">{milestone.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(dateObj, "MMMM d, yyyy")}
              {isAnniversary && (
                <span className="ml-2 text-muted-foreground/60">
                  · {new Date().getFullYear() - dateObj.getFullYear()} year{new Date().getFullYear() - dateObj.getFullYear() !== 1 ? "s" : ""} ago
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {days !== null && <CountdownBadge days={days} />}
            {canDelete && (
              <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {milestone.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{milestone.description}</p>
        )}
      </div>
    </div>
  );
}
