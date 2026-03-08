import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Upload, LogOut, Moon, Sun, LayoutGrid, List, ArrowUpDown, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMedia, useStarredMedia, useRecentMedia, useMoveMedia } from "@/hooks/useMedia";
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
import { Slideshow } from "@/components/Slideshow";
import { PartnerBanner } from "@/components/PartnerBanner";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { ChatView } from "@/components/ChatView";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BillingView } from "@/components/BillingView";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const SPECIAL_VIEWS = ["all", "unfiled", "starred", "recent", "timeline", "on-this-day", "anniversaries", "chat", "activity", "billing"];

// Map URL tab param → ViewType
function tabToView(tab?: string): ViewType {
  if (!tab) return "all";
  return tab as ViewType;
}

// Map ViewType → URL tab param
function viewToTab(view: ViewType): string {
  return view;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { tab, folderId: folderParam } = useParams<{ tab?: string; folderId?: string }>();

  // Derive selected view from URL
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

  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadPref<ViewMode>(STORAGE_KEY_VIEW, "grid"));
  const [dragOverMain, setDragOverMain] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>(() => loadPref<SortKey>(STORAGE_KEY_SORT + "_key", "created_at"));
  const [sortDir, setSortDir] = useState<SortDir>(() => loadPref<SortDir>(STORAGE_KEY_SORT + "_dir", "desc"));
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const moveMedia = useMoveMedia();
  const { data: profile } = useProfile();
  const { data: onThisDayMedia = [] } = useOnThisDay();
  const { data: couple } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const seenMediaRef = useRef<Set<string>>(new Set());

  // Persist prefs
  useEffect(() => { localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify(viewMode)); }, [viewMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SORT + "_key", JSON.stringify(sortKey)); }, [sortKey]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SORT + "_dir", JSON.stringify(sortDir)); }, [sortDir]);

  // Realtime: toast when partner uploads or edits
  useEffect(() => {
    if (!user || couple?.status !== "active") return;
    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
    if (!partnerId) return;
    const partnerProfile = profiles.find(p => p.user_id === partnerId);
    const partnerName = partnerProfile?.display_name ?? "Your partner";

    const channel = supabase
      .channel("partner-media-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "media" }, (payload) => {
        const row = payload.new as { uploaded_by: string; id: string; title?: string };
        if (row.uploaded_by !== partnerId) return;
        if (seenMediaRef.current.has(row.id)) return;
        seenMediaRef.current.add(row.id);
        toast({ title: `${partnerName} added a new photo 💕`, description: row.title || undefined });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "media" }, (payload) => {
        const row = payload.new as { uploaded_by: string; id: string; title?: string };
        if (row.uploaded_by !== partnerId) return;
        toast({ title: `${partnerName} updated a memory ✏️`, description: row.title || undefined });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, couple, profiles, toast]);

  const isSpecialView = SPECIAL_VIEWS.includes(selectedView);

  const folderId = selectedView === "all" ? undefined
    : selectedView === "unfiled" ? null
    : isSpecialView ? undefined
    : selectedView;

  const { data: regularMedia = [], isLoading } = useMedia(
    isSpecialView && selectedView !== "starred" && selectedView !== "recent" ? folderId : (isSpecialView ? undefined : folderId),
    search || undefined
  );
  const { data: starredMedia = [] } = useStarredMedia();
  const { data: recentMedia = [] } = useRecentMedia();
  const { data: folders = [] } = useFolders();

  const rawMedia = selectedView === "starred" ? starredMedia
    : selectedView === "recent" ? recentMedia
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
    : selectedView === "unfiled" ? "Unfiled"
    : selectedView === "starred" ? "Starred"
    : selectedView === "recent" ? "Recent"
    : selectedView === "timeline" ? "Memories Timeline"
    : selectedView === "on-this-day" ? `On This Day · ${format(new Date(), "MMMM d")}`
    : selectedView === "anniversaries" ? "Anniversaries & Milestones"
    : selectedView === "chat" ? "Chat with Partner 💬"
    : selectedView === "activity" ? "Activity Feed"
    : selectedView === "billing" ? "Billing & Plan"
    : currentFolder?.name || "Folder";

  const avatarUrl = profile?.avatar_url ?? null;
  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "U";
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    const handler = (e: Event) => {
      const { mediaId, folderId } = (e as CustomEvent).detail;
      moveMedia.mutateAsync({ id: mediaId, folderId }).then(() => {
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

  const isGridView = !["timeline", "anniversaries", "chat", "activity", "billing"].includes(selectedView);
  const isChat = selectedView === "chat";

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <AppSidebar
          selectedView={selectedView}
          onSelectView={setSelectedView}
          onStartSlideshow={() => setSlideshowOpen(true)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header — hidden when chat is fullscreen on mobile */}
          {(!isChat) && (
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
                      title={viewMode === "grid" ? "Switch to list" : "Switch to grid"}
                    >
                      {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    </Button>
                  </>
                )}

                {/* Theme toggle */}
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <NotificationsPanel />

                {/* Upload */}
                <Button onClick={() => setUploadOpen(true)} size="sm" className="gap-1.5 h-9 px-2 sm:px-3">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                      <Avatar className="h-7 w-7">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="h-4 w-4 mr-2" /> Profile settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          )}

          {/* Banners */}
          {!isChat && <PartnerBanner />}
          {!isChat && <UpgradeBanner onUpgrade={() => setSelectedView("billing")} selectedView={selectedView} />}

          {/* Content */}
          {isChat ? (
            <div className="flex-1 overflow-hidden" style={{ background: "#171716" }}>
              <ChatView onBack={() => setSelectedView("all")} />
            </div>
          ) : (
            <main
              className={cn(
                "flex-1 overflow-auto pb-20 sm:pb-6",
                "p-3 sm:p-4 md:p-6",
                dragOverMain && "ring-2 ring-primary ring-inset"
              )}
              onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes("Files")) setDragOverMain(true); }}
              onDragLeave={() => setDragOverMain(false)}
              onDrop={handleMainDrop}
            >
              {/* Page header */}
              <div className={cn(selectedView === "billing" ? "mb-0" : "mb-4 sm:mb-6")}>
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

              {/* View content */}
              {selectedView === "timeline" ? (
                <MemoriesTimeline onPreview={(mediaId) => {
                  const idx = media.findIndex(m => m.id === mediaId);
                  setSelectedView("all");
                  setTimeout(() => setPreviewIndex(idx >= 0 ? idx : 0), 100);
                }} />
              ) : selectedView === "anniversaries" ? (
                <AnniversariesView />
              ) : selectedView === "activity" ? (
                <ActivityFeed />
              ) : selectedView === "billing" ? (
                <BillingView />
              ) : (
                <MediaGrid
                  media={media}
                  loading={isLoading && !["starred", "recent", "on-this-day"].includes(selectedView)}
                  onPreview={(m) => setPreviewIndex(media.findIndex(x => x.id === m.id))}
                  viewMode={viewMode}
                />
              )}
            </main>
          )}
        </div>
      </div>

      {/* Mobile bottom nav — hidden on sm+ and in chat */}
      {!isChat && (
        <MobileBottomNav
          selectedView={selectedView}
          onSelectView={setSelectedView}
          onUpload={() => setUploadOpen(true)}
        />
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {previewIndex >= 0 && media.length > 0 && (
        <MediaPreview
          media={media}
          currentIndex={previewIndex}
          open={previewIndex >= 0}
          onOpenChange={(open) => { if (!open) setPreviewIndex(-1); }}
          onNavigate={(idx) => setPreviewIndex(idx)}
        />
      )}

      <Slideshow
        media={media}
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
      />

      <PWAInstallPrompt />
    </SidebarProvider>
  );
}
