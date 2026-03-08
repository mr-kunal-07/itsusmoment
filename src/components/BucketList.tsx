import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Lock, ListChecks } from "lucide-react";
import { useBucketList, useAddBucketItem, useToggleBucketItem, useDeleteBucketItem } from "@/hooks/useBucketList";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAllProfiles } from "@/hooks/useProfile";

export function BucketList() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const { data: items = [], isLoading } = useBucketList();
  const { data: profiles = [] } = useAllProfiles();
  const addItem = useAddBucketItem();
  const toggleItem = useToggleBucketItem();
  const deleteItem = useDeleteBucketItem();
  const [text, setText] = useState("");

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

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || addItem.isPending) return;
    setText("");
    await addItem.mutateAsync(trimmed);
  };

  const getAdderName = (userId: string) => {
    if (userId === user?.id) return "You";
    return profiles.find(p => p.user_id === userId)?.display_name ?? "Partner";
  };

  const SUGGESTIONS = [
    "Watch the sunrise together 🌅",
    "Cook a new recipe together 🍳",
    "Take a road trip 🚗",
    "Write love letters 💌",
    "Learn a dance together 💃",
    "Plant something and watch it grow 🌱",
    "Have a picnic under the stars 🌟",
    "Visit a country neither has been to ✈️",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <ListChecks className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-heading text-foreground">Our Bucket List</h2>
          <p className="text-xs text-muted-foreground">{pending.length} left · {done.length} done</p>
        </div>
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add something to your list…"
          className="flex-1"
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
        />
        <Button onClick={handleAdd} disabled={!text.trim() || addItem.isPending} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Suggestions (shown when list is empty) */}
      {items.length === 0 && !isLoading && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">✨ Need ideas?</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setText(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 group hover:border-primary/30 transition-colors"
            >
              <button
                onClick={() => toggleItem.mutate({ id: item.id, done: true })}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
              >
                <Circle className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.text}</p>
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
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">🎉 Completed</p>
          {done.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 group opacity-70 hover:opacity-90 transition-opacity"
            >
              <button
                onClick={() => toggleItem.mutate({ id: item.id, done: false })}
                className="shrink-0 text-primary"
              >
                <CheckCircle2 className="h-5 w-5 fill-primary/20" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate line-through decoration-muted-foreground/50">{item.text}</p>
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
    </div>
  );
}
