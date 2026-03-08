import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { Upload, MessageCircleHeart, Smile, Trophy, Activity, Image, Video } from "lucide-react";
import { useActivityFeed, ActivityItem } from "@/hooks/useActivityFeed";
import { useAllProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { getPublicUrl } from "@/hooks/useMedia";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function groupByDay(items: ActivityItem[]) {
  const groups: { day: string; items: ActivityItem[] }[] = [];
  items.forEach(item => {
    const day = format(new Date(item.created_at), "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  });
  return groups;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const base = "h-3.5 w-3.5";
  if (type === "upload") return <Upload className={cn(base, "text-primary")} />;
  if (type === "note") return <MessageCircleHeart className={cn(base, "text-pink-500")} />;
  if (type === "reaction") return <Smile className={cn(base, "text-yellow-500")} />;
  if (type === "milestone") return <Trophy className={cn(base, "text-amber-500")} />;
  return null;
}

function ActivityRow({ item, profileMap, userId }: { item: ActivityItem; profileMap: Record<string, string>; userId: string | undefined }) {
  const isMe = item.actor_id === userId;
  const actorName = isMe ? "You" : (profileMap[item.actor_id] ?? "Partner");
  const time = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  let description = "";
  if (item.type === "upload") description = `uploaded "${item.media_title ?? "a file"}"`;
  else if (item.type === "note") description = `left a note on "${item.media_title ?? "a photo"}"`;
  else if (item.type === "reaction") description = `reacted ${item.emoji} to "${item.media_title ?? "a photo"}"`;
  else if (item.type === "milestone") description = `added ${item.milestone_type === "anniversary" ? "an anniversary" : "a milestone"} "${item.milestone_title}"`;

  const hasThumbnail = (item.type === "upload" || item.type === "note" || item.type === "reaction") && item.media_file_path;

  return (
    <div className="flex items-start gap-3 py-2.5 group">
      {/* Icon bubble */}
      <div className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        item.type === "upload" ? "bg-primary/10" :
        item.type === "note" ? "bg-pink-500/10" :
        item.type === "reaction" ? "bg-yellow-500/10" :
        "bg-amber-500/10"
      )}>
        <ActivityIcon type={item.type} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actorName}</span>{" "}
          <span className="text-muted-foreground">{description}</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
      </div>

      {/* Thumbnail */}
      {hasThumbnail && (
        <div className="shrink-0">
          {item.media_file_type === "video" ? (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center border">
              <Video className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={getPublicUrl(item.media_file_path!)}
              alt=""
              className="h-10 w-10 rounded-lg object-cover border"
              loading="lazy"
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ActivityFeed() {
  const { user } = useAuth();
  const { data: activityItems = [], isLoading } = useActivityFeed();
  const { data: profiles = [] } = useAllProfiles();

  const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.display_name ?? "Partner"]));
  const groups = groupByDay(activityItems);

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-2xl">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activityItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Activity className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload a photo or leave a note to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-1">
      {groups.map(group => (
        <div key={group.day}>
          {/* Day separator */}
          <div className="flex items-center gap-3 py-3 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground font-medium px-1">
              {formatDay(group.items[0].created_at)}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="divide-y divide-border/50">
            {group.items.map(item => (
              <ActivityRow key={item.id} item={item} profileMap={profileMap} userId={user?.id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
