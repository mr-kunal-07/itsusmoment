import { useEffect, useRef } from "react";
import { Home, CalendarHeart, MessageCircleHeart, Upload, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewType } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";
import { usePlan } from "@/hooks/useSubscription";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  selectedView: ViewType;
  onSelectView: (view: ViewType) => void;
  onUpload: () => void;
}

const PLAN_LABEL: Record<string, string> = {
  single: "Free",
  dating: "Dating",
  soulmate: "Soul",
};

/** Lightweight hook — only counts unread, never marks as read */
function useUnreadCount() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const coupleId = couple?.status === "active" ? couple.id : null;
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: count = 0 } = useQuery({
    queryKey: ["unread-count", coupleId],
    enabled: !!coupleId && !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages" as never)
        .select("id", { count: "exact", head: true })
        .eq("couple_id", coupleId!)
        .neq("sender_id", user!.id)
        .is("read_at", null) as unknown as { count: number | null; error: unknown };
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 0,
  });

  // Realtime: refresh count on any message change
  useEffect(() => {
    if (!coupleId || !user) return;
    channelRef.current = supabase
      .channel(`unread-count:${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-count", coupleId] });
      })
      .subscribe();
    return () => {
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    };
  }, [coupleId, user, queryClient]);

  return count;
}

export function MobileBottomNav({ selectedView, onSelectView, onUpload }: Props) {
  const unreadCount = useUnreadCount();
  const plan = usePlan();

  const isPlanActive = selectedView === "billing";
  const chatBadge = selectedView === "chat" ? 0 : unreadCount;

  const SPECIAL_VIEWS = [
    "all", "starred", "recently-deleted",
    "timeline", "on-this-day", "anniversaries",
    "chat", "activity", "billing", "settings", "love-story", "travel-map",
  ];
  const isAllFilesView = selectedView === "all" || !SPECIAL_VIEWS.includes(selectedView);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center h-16">

        {/* Files */}
        <NavBtn id="all" label="Files" icon={Home} selectedView={selectedView} onSelectView={onSelectView} />

        {/* Memories */}
        <NavBtn id="timeline" label="Memories" icon={CalendarHeart} selectedView={selectedView} onSelectView={onSelectView} />

        {/* Upload FAB — centre; only visible on All Files / folder views */}
        <button
          onClick={onUpload}
          aria-label="Upload"
          className={cn(
            "relative flex flex-col items-center justify-center flex-1 py-2 group",
            isAllFilesView ? "opacity-100" : "opacity-30 pointer-events-none"
          )}
        >
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center -mt-6 shadow-lg ring-4 ring-background transition-transform active:scale-95 group-active:scale-95">
            <Upload className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Upload</span>
        </button>

        {/* Chat — with unread badge */}
        <NavBtn
          id="chat"
          label="Chat"
          icon={MessageCircleHeart}
          selectedView={selectedView}
          onSelectView={onSelectView}
          badge={chatBadge}
        />

        {/* Plan */}
        <button
          onClick={() => onSelectView("billing")}
          aria-label="Plan"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors relative",
            isPlanActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isPlanActive && (
            <span className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary" />
          )}
          <span className="mt-1">
            <Crown className={cn("h-5 w-5 transition-transform", isPlanActive && "scale-110 fill-primary/20")} />
          </span>
          <span className={cn("text-[10px] font-medium", isPlanActive ? "text-primary" : "text-muted-foreground")}>
            {PLAN_LABEL[plan] ?? "Plan"}
          </span>
        </button>

      </div>
    </nav>
  );
}

function NavBtn({
  id, label, icon: Icon, selectedView, onSelectView, badge,
}: {
  id: ViewType; label: string; icon: React.ElementType;
  selectedView: ViewType; onSelectView: (v: ViewType) => void;
  badge?: number;
}) {
  const isActive = selectedView === id;
  return (
    <button
      onClick={() => onSelectView(id)}
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors relative",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {/* Active indicator pill */}
      {isActive && (
        <span className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary" />
      )}
      <span className="relative mt-1">
        <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
        {!!badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className={cn("text-[10px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
