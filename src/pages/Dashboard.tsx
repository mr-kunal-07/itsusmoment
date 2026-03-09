import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Upload, Moon, Sun, LayoutGrid, List, ArrowUpDown, Crown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlan } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useMedia, useStarredMedia, useMoveMedia } from "@/hooks/useMedia";
import { useFolders } from "@/hooks/useFolders";
import { useTheme } from "@/hooks/useTheme";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useOnThisDay } from "@/hooks/useMemories";
import { useMyCouple } from "@/hooks/useCouple";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, ViewType } from "@/components/AppSidebar";
import { MediaGrid, ViewMode } from "@/components/MediaGrid";
import { UploadDialog } from "@/components/UploadDialog";
import { MediaPreview } from "@/components/MediaPreview";
import { FolderBreadcrumb } from "@/components/FolderBreadcrumb";
import { MemoriesTimeline } from "@/components/MemoriesView";
import { AnniversariesView } from "@/components/AnniversariesView";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { PartnerBanner } from "@/components/PartnerBanner";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { ChatView } from "@/components/ChatView";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BillingView } from "@/components/BillingView";
import { SettingsView } from "@/components/SettingsView";
import { RecentlyDeletedView } from "@/components/RecentlyDeletedView";
import { LoveStoryView } from "@/components/LoveStoryView";
import { TravelMapView } from "@/components/travel-map/TravelMapView";
import { UpgradeGateModal } from "@/components/UpgradeGateModal";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

type FileTypeFilter = "all" | "image" | "video";
type SortKey = "created_at" | "title" | "file_size";
type SortDir = "asc" | "desc";

const STORAGE_KEY_SORT = "mediahub_sort";
const STORAGE_KEY_VIEW = "mediahub_view";

function loadPref<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

const SPECIAL_VIEWS = [
  "all", "starred", "recently-deleted",
  "timeline", "on-this-day", "anniversaries",
  "chat", "activity", "billing", "settings", "love-story", "travel-map",
];

function tabToView(tab?: string): ViewType {
  if (!tab) return "all";
  return tab as ViewType;
}

function viewToTab(view: ViewType): string {
  return view;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tab, folderId: folderParam } = useParams<{ tab?: string; folderId?: string }>();

  const selectedView: ViewType = folderParam ? folderParam : tabToView(tab);

  const setSelectedView = useCallback((view: ViewType) => {
    const isFolder = !SPECIAL_VIEWS.includes(view) && view !== "all";
    if (isFolder) {
      navigate(`/dashboard/folder/${view}`, { replace: false });
    } else {
      const t = viewToTab(view);
      navigate(t === "all" ? "/dashboard" : `/dashboard/${t}`, { replace: false });
    }
  }, [navigate]);

  // Gated navigation — intercepts paid-only views for free users
  const navigateToView = useCallback((view: ViewType) => {
    // plan is read below after hooks, so we use a ref-style check via a closure-captured value
    // This will be resolved by using the plan state declared after hooks
    setSelectedView(view);
  }, [setSelectedView]);

  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadPref<ViewMode>(STORAGE_KEY_VIEW, "grid"));
  const [dragOverMain, setDragOverMain] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>(() => loadPref<SortKey>(STORAGE_KEY_SORT + "_key", "created_at"));
  const [sortDir, setSortDir] = useState<SortDir>(() => loadPref<SortDir>(STORAGE_KEY_SORT + "_dir", "desc"));
  const [gateModal, setGateModal] = useState<{ feature: string; plan: "dating" | "soulmate" } | null>(null);

  // Views that require a paid plan
  const PAID_VIEWS: Record<string, { feature: string; plan: "dating" | "soulmate" }> = {
    "love-story": { feature: "Love Story Card", plan: "dating" },
    "travel-map": { feature: "Travel Map", plan: "dating" },
  };
  
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const moveMedia = useMoveMedia();
  const { data: profile } = useProfile();
  const { data: onThisDayMedia = [] } = useOnThisDay();
  const { data: couple } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const plan = usePlan();
  const profileInitials = (profile?.display_name ?? user?.email ?? "U").slice(0, 2).toUpperCase();
  const seenMediaRef = useRef<Set<string>>(new Set());

  // Override navigateToView now that `plan` is available
  const gatedNavigate = useCallback((view: ViewType) => {
    if (plan === "single" && PAID_VIEWS[view]) {
      setGateModal(PAID_VIEWS[view]);
      return;
    }
    setSelectedView(view);
  }, [plan, setSelectedView]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify(viewMode)); }, [viewMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SORT + "_key", JSON.stringify(sortKey)); }, [sortKey]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SORT + "_dir", JSON.stringify(sortDir)); }, [sortDir]);

  // Realtime: toast when partner uploads
  useEffect(() => {
    if (!user || couple?.status !== "active") return;
    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
    if (!partnerId) return;
    const partnerName = profiles.find(p => p.user_id === partnerId)?.display_name ?? "Your partner";

    const channel = supabase
      .channel("partner-media-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "media" }, (payload) => {
        const row = payload.new as { uploaded_by: string; id: string; title?: string };
        if (row.uploaded_by !== partnerId) return;
        if (seenMediaRef.current.has(row.id)) return;
        seenMediaRef.current.add(row.id);
        toast({ title: `${partnerName} added a new photo 💕`, description: row.title || undefined });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, couple, profiles, toast]);

  const isSpecialView = SPECIAL_VIEWS.includes(selectedView);

  const folderId = selectedView === "all" ? undefined
    : isSpecialView ? undefined
    : selectedView;

  const { data: regularMedia = [], isLoading } = useMedia(
    isSpecialView && selectedView !== "starred" ? undefined : folderId,
    search || undefined
  );
  const { data: starredMedia = [] } = useStarredMedia();
  const { data: folders = [] } = useFolders();

  const rawMedia = selectedView === "starred" ? starredMedia
    : selectedView === "on-this-day" ? onThisDayMedia
    : regularMedia;

  const typeFiltered = fileTypeFilter === "all" ? rawMedia
    : rawMedia.filter(m => m.file_type === fileTypeFilter);

  const media = [...typeFiltered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    else if (sortKey === "title") cmp = a.title.localeCompare(b.title);
    else if (sortKey === "file_size") cmp = a.file_size - b.file_size;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const currentFolder = !isSpecialView ? folders.find(f => f.id === selectedView) : null;
  const pageTitle = selectedView === "all" ? "All Files"
    : selectedView === "starred" ? "Starred"
    : selectedView === "recently-deleted" ? "Recently Deleted"
    : selectedView === "timeline" ? "Memories Timeline"
    : selectedView === "on-this-day" ? `On This Day · ${format(new Date(), "MMMM d")}`
    : selectedView === "anniversaries" ? "Anniversaries & Milestones"
    : selectedView === "chat" ? "Chat with Partner 💬"
    : selectedView === "activity" ? "Activity Feed"
    : selectedView === "billing" ? "Billing & Plan"
    : selectedView === "settings" ? "Settings"
    : selectedView === "love-story" ? "Love Story"
    : selectedView === "travel-map" ? "Travel Map"
    : currentFolder?.name || "Folder";

  const avatarUrl = profile?.avatar_url ?? null;

  useEffect(() => {
    const handler = (e: Event) => {
      const { mediaId, folderId: targetFolderId } = (e as CustomEvent).detail;
      moveMedia.mutateAsync({ id: mediaId, folderId: targetFolderId }).then(() => {
        toast({ title: "Moved to folder" });
      }).catch(() => {
        toast({ title: "Failed to move", variant: "destructive" });
      });
    };
    window.addEventListener("move-media", handler);
    return () => window.removeEventListener("move-media", handler);
  }, [moveMedia, toast]);

  const handleMainDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMain(false);
    if (e.dataTransfer.files.length > 0) setUploadOpen(true);
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortLabel = { created_at: "Date", title: "Name", file_size: "Size" }[sortKey] + (sortDir === "asc" ? " ↑" : " ↓");

  const NON_GRID_VIEWS = ["timeline", "anniversaries", "chat", "activity", "billing", "settings", "recently-deleted", "love-story", "travel-map"];
  const isGridView = !NON_GRID_VIEWS.includes(selectedView);
  const isChat = selectedView === "chat";

  return (
    <SidebarProvider defaultOpen={typeof window !== "undefined" && window.innerWidth >= 1024}>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <AppSidebar
          selectedView={selectedView}
          onSelectView={setSelectedView}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header — hidden in chat fullscreen on mobile */}
          {!isChat && (
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-3 sm:px-4 h-14 flex items-center gap-2 shadow-sm shrink-0">
              <SidebarTrigger className="shrink-0" />

              {isGridView && (
                <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search…"
                    className="pl-9 h-9 text-sm bg-muted/50 border-border"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              )}

              {/* File type filter — desktop only */}
              {isGridView && (
                <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-muted shrink-0">
                  {(["all", "image", "video"] as FileTypeFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFileTypeFilter(f)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                        fileTypeFilter === f
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-0.5 sm:gap-1 ml-auto shrink-0">
                {isGridView && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 hidden sm:flex">
                          <ArrowUpDown className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">{sortLabel}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => toggleSort("created_at")} className={cn(sortKey === "created_at" && "font-semibold")}>
                          Date {sortKey === "created_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleSort("title")} className={cn(sortKey === "title" && "font-semibold")}>
                          Name {sortKey === "title" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleSort("file_size")} className={cn(sortKey === "file_size" && "font-semibold")}>
                          Size {sortKey === "file_size" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex"
                      onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                    >
                      {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    </Button>
                  </>
                )}

                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <NotificationsPanel />

                {/* Upload — only on All Files and folder views (desktop) */}
                {(selectedView === "all" || !isSpecialView) && (
                  <Button onClick={() => setUploadOpen(true)} size="sm" className="gap-1.5 h-9 px-2 sm:px-3 hidden sm:flex">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </Button>
                )}

                {/* Profile — always visible; desktop shows name+plan too */}
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-accent transition-colors shrink-0"
                  aria-label="Go to profile"
                >
                  <Avatar className="h-7 w-7 ring-2 ring-border">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile" />}
                    <AvatarFallback className="text-[10px] font-semibold">{profileInitials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start leading-none">
                    <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                      {profile?.display_name ?? user?.email?.split("@")[0] ?? "You"}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">{plan}</span>
                  </div>
                </button>
              </div>
            </header>
          )}

          {/* Banners */}
          {!isChat && <PartnerBanner />}
          {!isChat && <UpgradeBanner onUpgrade={() => setSelectedView("billing")} selectedView={selectedView} />}

          {/* Content */}
          {isChat ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatView onBack={() => setSelectedView("all")} />
            </div>
          ) : (
            <main
              className={cn(
                "flex-1 overflow-auto pb-20 sm:pb-6",
                selectedView !== "settings" && selectedView !== "travel-map" && "p-3 sm:p-4 md:p-6",
                dragOverMain && "ring-2 ring-primary ring-inset"
              )}
              onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes("Files")) setDragOverMain(true); }}
              onDragLeave={() => setDragOverMain(false)}
              onDrop={handleMainDrop}
            >
              {/* Page header */}
              {selectedView !== "settings" && selectedView !== "travel-map" && (
                <div className={cn(selectedView === "billing" ? "mb-0" : "mb-4 sm:mb-6", "p-3 sm:p-4 md:p-6 pt-0 pl-0 pr-0")}>
                  {!isSpecialView && (
                    <FolderBreadcrumb folderId={selectedView} folders={folders} onNavigate={setSelectedView} />
                  )}
                  {selectedView !== "billing" && (
                    <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-foreground">
                      {pageTitle}
                    </h1>
                  )}
                  {selectedView === "on-this-day" && onThisDayMedia.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      🗓️ {onThisDayMedia.length} {onThisDayMedia.length === 1 ? "memory" : "memories"} from previous years on this date
                    </p>
                  )}
                  {isGridView && !isLoading && selectedView !== "on-this-day" && (
                    <p className="text-sm text-muted-foreground mt-1">{media.length} file{media.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              )}

              {/* View content */}
              {selectedView === "timeline" ? (
                <MemoriesTimeline onPreview={(mediaId) => {
                  const idx = media.findIndex(m => m.id === mediaId);
                  setSelectedView("all");
                  setTimeout(() => setPreviewIndex(idx >= 0 ? idx : 0), 100);
                }} />
              ) : selectedView === "anniversaries" ? (
                <AnniversariesView />
              ) : selectedView === "love-story" ? (
                <LoveStoryView />
              ) : selectedView === "travel-map" ? (
                <TravelMapView />
              ) : selectedView === "activity" ? (
                <ActivityFeed />
              ) : selectedView === "billing" ? (
                <BillingView />
              ) : selectedView === "settings" ? (
                <SettingsView onNavigateBilling={() => setSelectedView("billing")} />
              ) : selectedView === "recently-deleted" ? (
                <RecentlyDeletedView />
              ) : (
                <MediaGrid
                  media={media}
                  loading={isLoading}
                  onPreview={(item) => setPreviewIndex(media.findIndex(m => m.id === item.id))}
                  viewMode={viewMode}
                />
              )}
            </main>
          )}
        </div>

        {/* Dialogs */}
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          folderId={!isSpecialView ? selectedView : null}
        />

        {previewIndex >= 0 && (
          <MediaPreview
            media={media}
            currentIndex={previewIndex}
            open={previewIndex >= 0}
            onOpenChange={(open) => { if (!open) setPreviewIndex(-1); }}
            onNavigate={setPreviewIndex}
          />
        )}

        {!isChat && (
          <MobileBottomNav
            selectedView={selectedView}
            onSelectView={setSelectedView}
            onUpload={() => (selectedView === "all" || !isSpecialView) && setUploadOpen(true)}
          />
        )}

        <PWAInstallPrompt />
      </div>
    </SidebarProvider>
  );
}
