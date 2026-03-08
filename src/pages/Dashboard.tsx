import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Upload, LogOut, Moon, Sun, LayoutGrid, List, ArrowUpDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

const SPECIAL_VIEWS = ["all", "unfiled", "starred", "recent", "timeline", "on-this-day", "anniversaries"];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<ViewType>("all");
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

  // Persist prefs
  useEffect(() => { localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify(viewMode)); }, [viewMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SORT + "_key", JSON.stringify(sortKey)); }, [sortKey]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_SORT + "_dir", JSON.stringify(sortDir)); }, [sortDir]);

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

  const isGridView = selectedView !== "timeline" && selectedView !== "anniversaries";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          selectedView={selectedView}
          onSelectView={setSelectedView}
          onStartSlideshow={() => setSlideshowOpen(true)}
        />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 h-14 flex items-center gap-3 shadow-sm">
            <SidebarTrigger className="shrink-0" />

            {isGridView && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            {isGridView && (
              <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
                {(["all", "image", "video"] as FileTypeFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFileTypeFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      fileTypeFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              {isGridView && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 hidden sm:flex">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        {sortLabel}
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

                  <Button variant="ghost" size="icon" className="h-9 w-9"
                    onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                    title={viewMode === "grid" ? "Switch to list" : "Switch to grid"}
                  >
                    {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  </Button>
                </>
              )}

              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <NotificationsPanel />

              <Button onClick={() => setUploadOpen(true)} size="sm" className="gap-1.5">
                <Upload className="h-4 w-4" /> Upload
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
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

          {/* Content */}
          <main
            className={cn("flex-1 p-6", dragOverMain && "ring-2 ring-primary ring-inset bg-primary/5")}
            onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes("Files")) setDragOverMain(true); }}
            onDragLeave={() => setDragOverMain(false)}
            onDrop={handleMainDrop}
          >
            <div className="mb-6">
              {!isSpecialView && (
                <FolderBreadcrumb folderId={selectedView} folders={folders} onNavigate={setSelectedView} />
              )}
              <h1 className="text-2xl font-bold font-heading tracking-tight">{pageTitle}</h1>

              {/* On This Day sub-header */}
              {selectedView === "on-this-day" && onThisDayMedia.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  🗓️ {onThisDayMedia.length} {onThisDayMedia.length === 1 ? "memory" : "memories"} from previous years on this date
                </p>
              )}

              {isGridView && !isLoading && selectedView !== "on-this-day" && (
                <p className="text-sm text-muted-foreground mt-1">{media.length} file{media.length !== 1 ? "s" : ""}</p>
              )}
            </div>

            {/* Render correct view */}
            {selectedView === "timeline" ? (
              <MemoriesTimeline onPreview={(mediaId) => {
                const allFlat = media;
                const idx = allFlat.findIndex(m => m.id === mediaId);
                setSelectedView("all");
                setTimeout(() => setPreviewIndex(idx >= 0 ? idx : 0), 100);
              }} />
            ) : selectedView === "anniversaries" ? (
              <AnniversariesView />
            ) : (
              <MediaGrid
                media={media}
                loading={isLoading && !["starred","recent","on-this-day"].includes(selectedView)}
                onPreview={(m) => setPreviewIndex(media.findIndex(x => x.id === m.id))}
                viewMode={viewMode}
              />
            )}
          </main>
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folderId={!isSpecialView ? selectedView : undefined} />
      <MediaPreview
        media={media}
        currentIndex={previewIndex}
        open={previewIndex >= 0}
        onOpenChange={open => !open && setPreviewIndex(-1)}
        onNavigate={setPreviewIndex}
      />
      <Slideshow
        media={media.length > 0 ? media : []}
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
      />
    </SidebarProvider>
  );
}
