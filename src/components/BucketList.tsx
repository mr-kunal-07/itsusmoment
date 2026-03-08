import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Lock, ListChecks, Sparkles, Trophy, Heart, MapPin, Utensils, Music } from "lucide-react";
import { useBucketList, useAddBucketItem, useToggleBucketItem, useDeleteBucketItem } from "@/hooks/useBucketList";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAllProfiles } from "@/hooks/useProfile";

const CATEGORIES = [
  { id: "all",      label: "All",      emoji: "✨" },
  { id: "travel",   label: "Travel",   emoji: "✈️" },
  { id: "food",     label: "Food",     emoji: "🍽️" },
  { id: "adventure",label: "Adventure",emoji: "🏔️" },
  { id: "romance",  label: "Romance",  emoji: "💑" },
  { id: "music",    label: "Music",    emoji: "🎵" },
] as const;
type CategoryId = (typeof CATEGORIES)[number]["id"];

const SUGGESTIONS: { text: string; cat: Exclude<CategoryId, "all"> }[] = [
  { text: "Watch the sunrise together 🌅", cat: "romance" },
  { text: "Cook a 3-course meal from scratch 🍳", cat: "food" },
  { text: "Take a spontaneous road trip 🚗", cat: "adventure" },
  { text: "Write love letters to each other 💌", cat: "romance" },
  { text: "Learn a couples dance 💃", cat: "music" },
  { text: "Plant something and watch it grow 🌱", cat: "adventure" },
  { text: "Have a picnic under the stars 🌟", cat: "romance" },
  { text: "Visit a country neither has been to ✈️", cat: "travel" },
  { text: "Try a new cuisine together 🍜", cat: "food" },
  { text: "Attend a live concert 🎸", cat: "music" },
  { text: "Go camping in the mountains ⛺", cat: "travel" },
  { text: "Take a cooking class together 👨‍🍳", cat: "food" },
];

export function BucketList() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const { data: items = [], isLoading } = useBucketList();
  const { data: profiles = [] } = useAllProfiles();
  const addItem = useAddBucketItem();
  const toggleItem = useToggleBucketItem();
  const deleteItem = useDeleteBucketItem();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (couple?.status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">No Partner Connected</h2>
          <p className="text-sm text-muted-foreground mt-1">Connect with your partner to share a bucket list.</p>
        </div>
      </div>
    );
  }

  const done = items.filter(i => i.done);
  const pending = items.filter(i => !i.done);
  const progress = items.length > 0 ? Math.round((done.length / items.length) * 100) : 0;

          const filteredPending = category === "all" ? pending : pending.filter(i => (i as any).category === category);
          const filteredDone    = category === "all" ? done    : done.filter(i => (i as any).category === category);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || addItem.isPending) return;
    setText("");
    await addItem.mutateAsync(trimmed);
    setShowSuggestions(false);
  };

  const getAdderName = (userId: string) => {
    if (userId === user?.id) return "You";
    return profiles.find(p => p.user_id === userId)?.display_name ?? "Partner";
  };

  const suggestionsToShow = category === "all"
    ? SUGGESTIONS
    : SUGGESTIONS.filter(s => s.cat === category);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header with progress */}
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
          {items.length > 0 && (
            <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add item */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={e => { setText(e.target.value); if (!showSuggestions) setShowSuggestions(true); }}
            placeholder="Add something to do together…"
            className="flex-1"
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            onFocus={() => setShowSuggestions(true)}
          />
          <Button onClick={handleAdd} disabled={!text.trim() || addItem.isPending} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Inline suggestions */}
        {showSuggestions && (
          <div className="rounded-xl border border-border bg-card p-3 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Ideas for you
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestionsToShow.slice(0, 6).map(s => (
                <button
                  key={s.text}
                  onClick={() => { setText(s.text); setShowSuggestions(false); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {s.text}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSuggestions(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
              Hide suggestions
            </button>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0",
              category === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span>{cat.emoji}</span>
            {cat.label}
            {cat.id !== "all" && (
              <span className={cn(
                "text-[10px] rounded-full px-1 leading-none",
                category === cat.id ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {items.filter(i => (i as any).category === cat.id || cat.id === "all").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state with big suggestions */}
      {!isLoading && items.length === 0 && (
        <div className="space-y-3 py-4">
          <div className="text-center space-y-1">
            <p className="text-4xl">🪣</p>
            <p className="text-sm font-medium text-foreground">Your bucket list is empty!</p>
            <p className="text-xs text-muted-foreground">Start dreaming together ✨</p>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">✨ Popular ideas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.slice(0, 6).map(s => (
              <button
                key={s.text}
                onClick={() => setText(s.text)}
                className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending items */}
      {filteredPending.length > 0 && (
        <div className="space-y-2">
          {filteredPending.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 group hover:border-primary/30 transition-all hover:shadow-sm"
            >
              <button
                onClick={() => toggleItem.mutate({ id: item.id, done: true })}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
              >
                <Circle className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.text}</p>
                <p className="text-[11px] text-muted-foreground">Added by {getAdderName(item.added_by)}</p>
              </div>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Done items */}
      {filteredDone.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completed ({filteredDone.length})</p>
          </div>
          {filteredDone.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 group opacity-70 hover:opacity-95 transition-opacity"
            >
              <button
                onClick={() => toggleItem.mutate({ id: item.id, done: false })}
                className="shrink-0 text-primary"
              >
                <CheckCircle2 className="h-5 w-5 fill-primary/20" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-through decoration-muted-foreground/50">{item.text}</p>
                <p className="text-[11px] text-muted-foreground">Added by {getAdderName(item.added_by)}</p>
              </div>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No items in filtered category */}
      {!isLoading && items.length > 0 && filteredPending.length === 0 && filteredDone.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No items in this category yet.</p>
      )}
    </div>
  );
}
