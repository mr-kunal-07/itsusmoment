import { useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Home, CalendarHeart, MessageCircleHeart, Upload, Map, MessageSquareMore, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewType, FolderViewType } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileBottomNavProps {
  selectedView: FolderViewType;
  onSelectView: (view: FolderViewType) => void;
  onUpload: () => void;
}

interface NavBtnProps {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  selectedView: FolderViewType;
  onSelectView: (v: FolderViewType) => void;
  badge?: number;
}

interface UploadFABProps {
  enabled: boolean;
  onUpload: () => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIAL_VIEWS = new Set<ViewType>([
  "all",
  "starred",
  "recently-deleted",
  "timeline",
  "on-this-day",
  "anniversaries",
  "chat",
  "activity",
  "billing",
  "settings",
  "love-story",
  "travel-map",
]);

const MAX_BADGE_COUNT = 99;

const NAV_ITEMS: readonly NavItem[] = [
  { id: "all", label: "Files", icon: Home },
  { id: "timeline", label: "Memories", icon: CalendarHeart },
] as const;

const NAV_ITEMS_AFTER_FAB: readonly NavItem[] = [
  { id: "chat", label: "Chat", icon: MessageSquareMore },
  { id: "travel-map", label: "Map", icon: MapPinned },
] as const;

const QUERY_STALE_TIME = 0;
const NAV_HEIGHT = "56px"; // 14 * 4 = 56px (h-14)
const ICON_SIZE = 22;
const BADGE_SIZE = 15;

// ─── Utility Functions ────────────────────────────────────────────────────────

function formatBadgeCount(count: number): string | number {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count;
}

function isAllFilesView(view: FolderViewType): boolean {
  return view === "all" || !SPECIAL_VIEWS.has(view as ViewType);
}

// ─── Unread Count Hook ────────────────────────────────────────────────────────

function useUnreadCount(): number {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const coupleId = useMemo(
    () => (couple?.status === "active" ? couple.id : null),
    [couple?.status, couple?.id]
  );

  const isEnabled = useMemo(() => !!coupleId && !!user, [coupleId, user]);

  const { data: count = 0 } = useQuery<number>({
    queryKey: ["unread-count", coupleId],
    enabled: isEnabled,
    staleTime: QUERY_STALE_TIME,
    queryFn: async () => {
      if (!coupleId || !user) return 0;

      try {
        const { count, error } = (await supabase
          .from("messages" as never)
          .select("id", { count: "exact", head: true })
          .eq("couple_id", coupleId)
          .neq("sender_id", user.id)
          .is("read_at", null)) as unknown as { count: number | null; error: unknown };

        if (error) {
          console.error("Failed to fetch unread count:", error);
          return 0;
        }

        return count ?? 0;
      } catch (error) {
        console.error("Error fetching unread count:", error);
        return 0;
      }
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!coupleId || !user) return;

    const channel = supabase
      .channel(`unread-count:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-count", coupleId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId, user, queryClient]);

  return count;
}

// ─── NavBtn Component ─────────────────────────────────────────────────────────

const NavBtn = memo(function NavBtn({
  id,
  label,
  icon: Icon,
  selectedView,
  onSelectView,
  badge,
}: NavBtnProps) {
  const isActive = selectedView === id;
  const hasBadge = useMemo(() => !!badge && badge > 0, [badge]);
  const badgeLabel = useMemo(() => formatBadgeCount(badge ?? 0), [badge]);

  const handlePress = useCallback(() => {
    onSelectView(id);
  }, [id, onSelectView]);

  return (
    <button
      onClick={handlePress}
      aria-label={hasBadge ? `${label} (${badge} unread)` : label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-[3px]",
        "flex-1 h-full min-w-0",
        "touch-manipulation select-none",
        "transition-colors duration-150",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-primary"
        />
      )}

      {/* Icon with badge */}
      <span className="relative">
        <Icon
          className={cn(
            "transition-transform duration-150",
            isActive && "scale-110"
          )}
          style={{
            height: `${ICON_SIZE}px`,
            width: `${ICON_SIZE}px`,
            ...(isActive && { filter: "drop-shadow(0 0 4px hsl(var(--primary)/0.4))" }),
          }}
          strokeWidth={isActive ? 2 : 1.75}
          aria-hidden="true"
        />

        {hasBadge && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -top-1 -right-1.5",
              "min-w-[15px] h-[15px] px-[3px]",
              "rounded-full border border-background",
              "bg-primary text-primary-foreground",
              "text-[8px] font-bold leading-none",
              "flex items-center justify-center"
            )}
          >
            {badgeLabel}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-[10px] font-medium leading-none truncate max-w-full px-1",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
});

// ─── Upload FAB Component ─────────────────────────────────────────────────────

const UploadFAB = memo(function UploadFAB({ enabled, onUpload }: UploadFABProps) {
  const handleClick = useCallback(() => {
    if (enabled) {
      onUpload();
    }
  }, [enabled, onUpload]);

  return (
    <div className="flex flex-col items-center justify-center flex-1" aria-hidden={!enabled}>
      <button
        onClick={handleClick}
        aria-label="Upload files"
        aria-disabled={!enabled}
        disabled={!enabled}
        className={cn(
          "flex items-center justify-center",
          "h-11 w-11 rounded-2xl bg-primary",
          "shadow-[0_4px_16px_hsl(var(--primary)/0.45)]",
          "transition-all duration-150 active:scale-90",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          !enabled && "pointer-events-none"
        )}
      >
        <Upload
          className="h-[18px] w-[18px] text-primary-foreground"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </button>
    </div>
  );
});

// ─── MobileBottomNav Component ────────────────────────────────────────────────

export const MobileBottomNav = memo(function MobileBottomNav({
  selectedView,
  onSelectView,
  onUpload,
}: MobileBottomNavProps) {
  const unreadCount = useUnreadCount();

  const uploadEnabled = useMemo(
    () => isAllFilesView(selectedView),
    [selectedView]
  );

  const chatBadge = useMemo(
    () => (selectedView === "chat" ? 0 : unreadCount),
    [selectedView, unreadCount]
  );

  const renderNavButton = useCallback(
    (item: NavItem, badge?: number) => (
      <NavBtn
        key={item.id}
        id={item.id}
        label={item.label}
        icon={item.icon}
        selectedView={selectedView}
        onSelectView={onSelectView}
        badge={badge}
      />
    ),
    [selectedView, onSelectView]
  );

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "sm:hidden"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-background backdrop-blur-xl border-t border-border/60">
        <div className="flex items-center h-14 px-1">
          {/* Left nav items */}
          {NAV_ITEMS.map((item) => renderNavButton(item))}

          {/* Upload FAB (center) */}
          <UploadFAB enabled={uploadEnabled} onUpload={onUpload} />

          {/* Right nav items */}
          {NAV_ITEMS_AFTER_FAB.map((item) =>
            renderNavButton(item, item.id === "chat" ? chatBadge : undefined)
          )}
        </div>
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = "MobileBottomNav";
NavBtn.displayName = "NavBtn";
UploadFAB.displayName = "UploadFAB";

export default MobileBottomNav;