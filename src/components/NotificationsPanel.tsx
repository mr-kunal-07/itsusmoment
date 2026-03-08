import { useNotifications, useMarkAllRead, useMarkRead, Notification } from "@/hooks/useNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Heart, Upload, MessageCircleHeart, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

function NotifIcon({ type }: { type: Notification["type"] }) {
  if (type === "upload") return <Upload className="h-3.5 w-3.5 text-primary" />;
  if (type === "love_note") return <MessageCircleHeart className="h-3.5 w-3.5 text-rose-400" />;
  if (type === "reaction") return <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400" />;
  if (type === "milestone") return <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />;
  return <Bell className="h-3.5 w-3.5" />;
}

export function NotificationsPanel() {
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();
  const [open, setOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const handleOpen = (o: boolean) => {
    setOpen(o);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm font-heading">Notifications</h3>
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className={cn("mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0", !n.read ? "bg-primary/10" : "bg-muted")}>
                  <NotifIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs leading-snug", !n.read ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
