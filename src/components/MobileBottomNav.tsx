import { useEffect, useRef, useCallback, memo } from "react";
import { Home, CalendarHeart, MessageCircleHeart, Upload, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewType } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileBottomNavProps {
  selectedView: ViewType;
  onSelectView: (view: ViewType) => void;
  onUpload: () => void;
}

interface NavBtnProps {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  selectedView: ViewType;
  onSelectView: (v: ViewType) => void;
  badge?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Views that are NOT the "all files" view.
 * Upload FAB is only active when the user is on the all-files view.
 */
const SPECIAL_VIEWS = new Set<ViewType>([
  "all", "starred", "recently-deleted",
  "timeline", "on-this-day", "anniversaries",
  "chat", "activity", "billing", "settings",
  "love-story", "travel-map",
]);

// ─── Unread-count hook ────────────────────────────────────────────────────────

/**
 * Lightweight hook — fetches unread message count and keeps it live via
 * Supabase realtime. Never marks messages as read.
 */
function useUnreadCount(): number {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const coupleId = couple?.status === "active" ? couple.id : null;
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: count = 0 } = useQuery<number>({
    queryKey: ["unread-count", coupleId],
    enabled: !!coupleId && !!user,
    staleTime: 0,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages" as never)
        .select("id", { count: "exact", head: true })
        .eq("couple_id", coupleId!)
        .neq("sender_id", user!.id)
        .is("read_at", null) as unknown as { count: number | null; error: unknown };

      return error ? 0 : (count ?? 0);
    },
  });

  // Realtime subscription — invalidates the count query on any message change
  useEffect(() => {
    if (!coupleId || !user) return;

    channelRef.current = supabase
      .channel(`unread-count:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
        () => queryClient.invalidateQueries({ queryKey: ["unread-count", coupleId] }),
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId, user, queryClient]);

  return count;
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────

const NavBtn = memo(function NavBtn({
  id,
  label,
  icon: Icon,
  selectedView,
  onSelectView,
  badge,
}: NavBtnProps) {
  const isActive = selectedView === id;
  const handlePress = useCallback(() => onSelectView(id), [id, onSelectView]);

  return (
    <button
      onClick={handlePress}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        // Layout
        "relative flex flex-col items-center justify-center gap-[3px]",
        "flex-1 h-full min-w-0",
        // Touch target — at least 44 × 44 px per WCAG
        "touch-manipulation select-none",
        // Colours
        "transition-colors duration-150",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70",
      )}
    >
      {/* Active pill indicator at top edge */}
      {isActive && (
        <span
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-primary"
        />
      )}

      {/* Icon + badge wrapper */}
      <span className="relative">
        <Icon
          className={cn(
            "h-[22px] w-[22px] transition-transform duration-150",
            isActive && "scale-110",
          )}
          strokeWidth={isActive ? 2 : 1.75}
          style={isActive ? { filter: "drop-shadow(0 0 4px hsl(var(--primary)/0.4))" } : undefined}
          aria-hidden
        />

        {/* Unread badge */}
        {!!badge && badge > 0 && (
          <span
            aria-label={`${badge} unread`}
            className={cn(
              "absolute -top-1 -right-1.5",
              "min-w-[15px] h-[15px] px-[3px]",
              "rounded-full border border-background",
              "bg-primary text-primary-foreground",
              "text-[8px] font-bold leading-none",
              "flex items-center justify-center",
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-[10px] font-medium leading-none truncate max-w-full px-1",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
});

// ─── Upload FAB ───────────────────────────────────────────────────────────────

interface UploadFABProps {
  enabled: boolean;
  onUpload: () => void;
}

const UploadFAB = memo(function UploadFAB({ enabled, onUpload }: UploadFABProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1" aria-hidden={!enabled}>
      <button
        onClick={enabled ? onUpload : undefined}
        aria-label="Upload"
        aria-disabled={!enabled}
        className={cn(
          "flex items-center justify-center",
          "h-11 w-11 rounded-2xl bg-primary",
          "shadow-[0_4px_16px_hsl(var(--primary)/0.45)]",
          "transition-all duration-150 active:scale-90",
          !enabled && "opacity-30 pointer-events-none",
        )}
      >
        <Upload className="h-[18px] w-[18px] text-primary-foreground" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
});

// ─── MobileBottomNav ──────────────────────────────────────────────────────────

export const MobileBottomNav = memo(function MobileBottomNav({
  selectedView,
  onSelectView,
  onUpload,
}: MobileBottomNavProps) {
  const unreadCount = useUnreadCount();

  // Upload FAB is only active on all-files views
  const isAllFilesView = selectedView === "all" || !SPECIAL_VIEWS.has(selectedView);

  // Suppress badge when already on the chat view
  const chatBadge = selectedView === "chat" ? 0 : unreadCount;

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        // Only visible on small screens; hidden on sm+ (use sidebar instead)
        "fixed bottom-0 left-0 right-0 z-50",
        "sm:hidden",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Frosted glass bar */}
      <div className="bg-background/90 backdrop-blur-xl border-t border-border/60">
        <div className="flex items-center h-14 px-1">

          {/* Files */}
          <NavBtn
            id="all"
            label="Files"
            icon={Home}
            selectedView={selectedView}
            onSelectView={onSelectView}
          />

          {/* Memories */}
          <NavBtn
            id="timeline"
            label="Memories"
            icon={CalendarHeart}
            selectedView={selectedView}
            onSelectView={onSelectView}
          />

          {/* Upload FAB — centred */}
          <UploadFAB enabled={isAllFilesView} onUpload={onUpload} />

          {/* Chat — with unread badge */}
          <NavBtn
            id="chat"
            label="Chat"
            icon={MessageCircleHeart}
            selectedView={selectedView}
            onSelectView={onSelectView}
            badge={chatBadge}
          />

          {/* Map */}
          <NavBtn
            id="travel-map"
            label="Map"
            icon={Map}
            selectedView={selectedView}
            onSelectView={onSelectView}
          />

        </div>
      </div>
    </nav>
  );
});

export default MobileBottomNav;