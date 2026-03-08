import { useState, useRef } from "react";
import {
  Plus, Trash2, CheckCircle2, Circle, Lock, ListChecks,
  Sparkles, Trophy, Calendar, Camera, X, Image, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useBucketList, useAddBucketItem, useToggleBucketItem,
  useDeleteBucketItem, useBucketListReactions, useToggleBucketReaction,
  BucketListItem,
} from "@/hooks/useBucketList";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAllProfiles } from "@/hooks/useProfile";
import { format, isPast, isToday, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",       label: "All",       emoji: "✨" },
  { id: "travel",    label: "Travel",    emoji: "✈️" },
  { id: "food",      label: "Food",      emoji: "🍽️" },
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "romance",   label: "Romance",   emoji: "💑" },
  { id: "music",     label: "Music",     emoji: "🎵" },
  { id: "other",     label: "Other",     emoji: "📌" },
] as const;
type CategoryId = (typeof CATEGORIES)[number]["id"];

const REACTION_EMOJIS = ["❤️", "🔥", "😍", "🎉", "😂"];

const SUGGESTIONS: { text: string; cat: Exclude<CategoryId, "all"> }[] = [
  { text: "Watch the sunrise together 🌅",         cat: "romance" },
  { text: "Cook a 3-course meal from scratch 🍳",  cat: "food" },
  { text: "Take a spontaneous road trip 🚗",       cat: "adventure" },
  { text: "Write love letters to each other 💌",   cat: "romance" },
  { text: "Learn a couples dance 💃",              cat: "music" },
  { text: "Plant something and watch it grow 🌱",  cat: "adventure" },
  { text: "Have a picnic under the stars 🌟",      cat: "romance" },
  { text: "Visit a country neither has been to ✈️",cat: "travel" },
  { text: "Try a new cuisine together 🍜",         cat: "food" },
  { text: "Attend a live concert 🎸",              cat: "music" },
  { text: "Go camping in the mountains ⛺",        cat: "travel" },
  { text: "Take a cooking class together 👨‍🍳",     cat: "food" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function DueBadge({ dueDate }: { dueDate: string }) {
  const d = new Date(dueDate);
  const overdue = isPast(d) && !isToday(d);
  const today   = isToday(d);
  const daysLeft = differenceInDays(d, new Date());

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
      overdue ? "bg-destructive/15 text-destructive" :
      today   ? "bg-primary/15 text-primary" :
                "bg-muted text-muted-foreground"
    )}>
      <Calendar className="h-2.5 w-2.5" />
      {overdue ? "Overdue" : today ? "Today!" : `${daysLeft}d`}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BucketList() {
  const { user } = useAuth();
  const { data: couple }          = useMyCouple();
  const { data: items = [], isLoading } = useBucketList();
  const { data: allReactions = [] }     = useBucketListReactions();
  const { data: profiles = [] }         = useAllProfiles();

  const addItem        = useAddBucketItem();
  const toggleItem     = useToggleBucketItem();
  const deleteItem     = useDeleteBucketItem();
  const toggleReaction = useToggleBucketReaction();

  // Add form state
  const [text, setText]         = useState("");
  const [category, setCategory] = useState<Exclude<CategoryId,"all">>("other");
  const [dueDate, setDueDate]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter
  const [filter, setFilter] = useState<CategoryId>("all");

  // Completion photo upload
  const [completingItem, setCompletingItem] = useState<BucketListItem | null>(null);
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Stats panel toggle
  const [showStats, setShowStats] = useState(false);

  if (couple?.status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold font-heading text-foreground">No Partner Connected</h2>
        <p className="text-sm text-muted-foreground">Connect with your partner to share a bucket list.</p>
      </div>
    );
  }

  const done    = items.filter(i => i.done);
  const pending = items.filter(i => !i.done);
  const progress = items.length > 0 ? Math.round((done.length / items.length) * 100) : 0;

  const filteredPending = filter === "all" ? pending : pending.filter(i => i.category === filter);
  const filteredDone    = filter === "all" ? done    : done.filter(i => i.category === filter);

  const getAdderName = (userId: string) => {
    if (userId === user?.id) return "You";
    return profiles.find(p => p.user_id === userId)?.display_name ?? "Partner";
  };

  const reactionsForItem = (itemId: string) =>
    allReactions.filter(r => r.item_id === itemId);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || addItem.isPending) return;
    await addItem.mutateAsync({ text: trimmed, category, due_date: dueDate || null });
    setText(""); setDueDate(""); setShowForm(false); setShowSuggestions(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleComplete = async (item: BucketListItem, withPhoto = false) => {
    if (withPhoto) {
      setCompletingItem(item);
      return;
    }
    await toggleItem.mutateAsync({ id: item.id, done: true });
  };

  const handleConfirmComplete = async () => {
    if (!completingItem) return;
    setUploading(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `bucket-list/${completingItem.id}.${ext}`;
        await supabase.storage.from("media").upload(path, photoFile, { upsert: true });
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
      await toggleItem.mutateAsync({ id: completingItem.id, done: true, completed_photo_url: photoUrl });
    } finally {
      setUploading(false);
      setCompletingItem(null);
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  // Stats
  const mostActive  = items.length > 0
    ? [user?.id, couple.user1_id === user?.id ? couple.user2_id : couple.user1_id]
        .filter(Boolean)
        .map(uid => ({
          name: uid === user?.id ? "You" : profiles.find(p => p.user_id === uid)?.display_name ?? "Partner",
          count: done.filter(i => i.added_by === uid).length,
        }))
        .sort((a, b) => b.count - a.count)[0]
    : null;

  const overdue = pending.filter(i => i.due_date && isPast(new Date(i.due_date)) && !isToday(new Date(i.due_date)));
  const upcoming = pending.filter(i => i.due_date && !isPast(new Date(i.due_date)));

  const milestone =
    progress === 100 ? "🏆 Everything done — legends!" :
    progress >= 75   ? "🎯 Almost there!" :
    progress >= 50   ? "🌟 Halfway through!" :
    progress >= 25   ? "✨ Great start!" :
    items.length > 0 ? "💪 Just getting started!" : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Header with progress ring ── */}
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" stroke="hsl(var(--muted))" strokeWidth="5" fill="none" />
            <circle
              cx="28" cy="28" r="22"
              stroke="hsl(var(--primary))"
              strokeWidth="5" fill="none"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{progress}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold font-heading text-foreground">Our Bucket List 🪣</h2>
          <p className="text-xs text-muted-foreground">{done.length} of {items.length} completed · {pending.length} to go</p>
          {milestone && <p className="text-xs text-primary font-medium mt-0.5">{milestone}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowStats(s => !s)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border"
          >
            <Trophy className="h-3.5 w-3.5" />
            Stats
            {showStats ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* ── Stats panel ── */}
      {showStats && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <StatCard label="Total items"   value={items.length}   emoji="📋" />
          <StatCard label="Completed"     value={done.length}    emoji="✅" />
          <StatCard label="Overdue"       value={overdue.length} emoji="⏰" highlight={overdue.length > 0} />
          <StatCard label="With due dates" value={items.filter(i => i.due_date).length} emoji="📅" />
          {mostActive && mostActive.count > 0 && (
            <div className="col-span-2 sm:col-span-4 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-muted-foreground">
              🏆 <strong className="text-foreground">{mostActive.name}</strong> added the most completed items ({mostActive.count})
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="col-span-2 sm:col-span-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              📅 Next up: <strong className="text-foreground">{upcoming[0].text}</strong>
              {upcoming[0].due_date && ` — ${format(new Date(upcoming[0].due_date), "MMM d")}`}
            </div>
          )}
        </div>
      )}

      {/* ── Add form ── */}
      {!showForm ? (
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(true); setShowSuggestions(true); }}
            className="flex-1 flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/40 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add something to your list…
          </button>
          <button
            onClick={() => { setShowSuggestions(s => !s); setShowForm(true); }}
            className="h-10 px-3 rounded-xl border border-border bg-muted/50 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What do you want to do together?"
            className="h-10"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowForm(false); }}
          />

          {/* Category + due date row */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="h-8 text-xs rounded-lg border border-border bg-muted px-2 text-foreground"
            >
              {CATEGORIES.filter(c => c.id !== "all").map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="h-8 text-xs rounded-lg border border-border bg-muted px-2 text-foreground flex-1 min-w-0"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!text.trim() || addItem.isPending} size="sm" className="gap-1.5 flex-1">
              <Plus className="h-4 w-4" /> Add to list
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="space-y-2 pt-1 border-t border-border">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Tap to fill
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.filter(s => filter === "all" || s.cat === filter).slice(0, 8).map(s => (
                  <button
                    key={s.text}
                    onClick={() => { setText(s.text); setCategory(s.cat); }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category filter ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0",
              filter === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span>{cat.emoji}</span>
            {cat.label}
            {cat.id !== "all" && (
              <span className={cn("text-[10px] rounded-full px-1", filter === cat.id ? "bg-primary-foreground/20" : "bg-muted")}>
                {items.filter(i => i.category === cat.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-10 space-y-3">
          <p className="text-4xl">🪣</p>
          <p className="text-sm font-medium text-foreground">Your bucket list is empty!</p>
          <p className="text-xs text-muted-foreground">Start dreaming together ✨</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-left">
            {SUGGESTIONS.slice(0, 6).map(s => (
              <button
                key={s.text}
                onClick={() => { setText(s.text); setCategory(s.cat); setShowForm(true); }}
                className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending items ── */}
      {filteredPending.length > 0 && (
        <div className="space-y-2">
          {filteredPending.map(item => (
            <BucketItem
              key={item.id}
              item={item}
              reactions={reactionsForItem(item.id)}
              userId={user?.id ?? ""}
              adderName={getAdderName(item.added_by)}
              onComplete={() => handleComplete(item, true)}
              onUncomplete={() => toggleItem.mutate({ id: item.id, done: false })}
              onDelete={() => deleteItem.mutate(item.id)}
              onReact={(emoji, hasReacted) => toggleReaction.mutate({ item_id: item.id, emoji, hasReacted })}
            />
          ))}
        </div>
      )}

      {/* ── Done items ── */}
      {filteredDone.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completed ({filteredDone.length})</p>
          </div>
          {filteredDone.map(item => (
            <BucketItem
              key={item.id}
              item={item}
              reactions={reactionsForItem(item.id)}
              userId={user?.id ?? ""}
              adderName={getAdderName(item.added_by)}
              onComplete={() => handleComplete(item, true)}
              onUncomplete={() => toggleItem.mutate({ id: item.id, done: false })}
              onDelete={() => deleteItem.mutate(item.id)}
              onReact={(emoji, hasReacted) => toggleReaction.mutate({ item_id: item.id, emoji, hasReacted })}
            />
          ))}
        </div>
      )}

      {!isLoading && items.length > 0 && filteredPending.length === 0 && filteredDone.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No items in this category yet.</p>
      )}

      {/* ── Complete with photo modal ── */}
      {completingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
            <div>
              <p className="text-sm font-semibold text-foreground">Mark as done 🎉</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">"{completingItem.text}"</p>
            </div>

            {/* Photo attachment */}
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                <img src={photoPreview} alt="Memory" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground"
              >
                <Camera className="h-8 w-8" />
                <span className="text-xs font-medium">Attach a memory photo (optional)</span>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                className="flex-1"
                onClick={() => { setCompletingItem(null); setPhotoFile(null); setPhotoPreview(null); }}
              >
                Cancel
              </Button>
              <Button
                size="sm" className="flex-1 gap-1.5"
                onClick={handleConfirmComplete}
                disabled={uploading}
              >
                {uploading ? "Saving…" : <><CheckCircle2 className="h-3.5 w-3.5" /> Done!</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, emoji, highlight }: { label: string; value: number; emoji: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg p-3 text-center", highlight ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50")}>
      <p className="text-lg">{emoji}</p>
      <p className={cn("text-xl font-bold font-heading", highlight ? "text-destructive" : "text-foreground")}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

interface BucketItemProps {
  item: BucketListItem;
  reactions: { id: string; item_id: string; user_id: string; emoji: string; created_at: string }[];
  userId: string;
  adderName: string;
  onComplete: () => void;
  onUncomplete: () => void;
  onDelete: () => void;
  onReact: (emoji: string, hasReacted: boolean) => void;
}

function BucketItem({ item, reactions, userId, adderName, onComplete, onUncomplete, onDelete, onReact }: BucketItemProps) {
  const [showReactions, setShowReactions] = useState(false);

  const grouped = REACTION_EMOJIS.map(emoji => ({
    emoji,
    count: reactions.filter(r => r.emoji === emoji).length,
    hasReacted: reactions.some(r => r.emoji === emoji && r.user_id === userId),
  })).filter(g => g.count > 0 || showReactions);

  const catInfo = ([...CATEGORIES] as const).find(c => c.id === item.category);

  return (
    <div className={cn(
      "rounded-xl border bg-card transition-all",
      item.done ? "border-border/50 opacity-80" : "border-border hover:border-primary/30 hover:shadow-sm"
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Check button */}
        <button
          onClick={item.done ? onUncomplete : onComplete}
          className={cn("mt-0.5 shrink-0 transition-colors", item.done ? "text-primary" : "text-muted-foreground hover:text-primary")}
        >
          {item.done
            ? <CheckCircle2 className="h-5 w-5 fill-primary/20" />
            : <Circle className="h-5 w-5" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start gap-2 flex-wrap">
            <p className={cn("text-sm font-medium text-foreground flex-1", item.done && "line-through decoration-muted-foreground/40")}>
              {item.text}
            </p>
            {item.due_date && !item.done && <DueBadge dueDate={item.due_date} />}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              {catInfo ? `${catInfo.emoji} ${catInfo.label}` : ""} · Added by {adderName}
            </span>
            {item.done && item.completed_at && (
              <span className="text-[10px] text-primary">
                ✓ {format(new Date(item.completed_at), "MMM d, yyyy")}
              </span>
            )}
            {item.due_date && item.done && (
              <span className="text-[10px] text-muted-foreground">
                📅 {format(new Date(item.due_date), "MMM d")}
              </span>
            )}
          </div>

          {/* Completed photo */}
          {item.done && item.completed_photo_url && (
            <a href={item.completed_photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
              <Image className="h-3 w-3" /> View memory photo
            </a>
          )}

          {/* Reactions row */}
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {grouped.map(({ emoji, count, hasReacted }) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji, hasReacted)}
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-all",
                  hasReacted
                    ? "bg-primary/15 border-primary/30 text-foreground"
                    : "bg-muted/50 border-transparent hover:border-border text-muted-foreground"
                )}
              >
                {emoji} {count > 0 && <span className="font-medium">{count}</span>}
              </button>
            ))}
            {!showReactions && (
              <button
                onClick={() => setShowReactions(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-full hover:bg-muted transition-colors"
              >
                + React
              </button>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
