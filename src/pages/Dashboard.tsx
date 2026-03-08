import { useState, useEffect, useCallback } from "react";
import { Search, Upload, LogOut, Moon, Sun, LayoutGrid, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMedia, useStarredMedia, useRecentMedia, useMoveMedia } from "@/hooks/useMedia";
import { useFolders } from "@/hooks/useFolders";
import { useTheme } from "@/hooks/useTheme";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, ViewType } from "@/components/AppSidebar";
import { MediaGrid, ViewMode } from "@/components/MediaGrid";
import { UploadDialog } from "@/components/UploadDialog";
import { MediaPreview } from "@/components/MediaPreview";
import { FolderBreadcrumb } from "@/components/FolderBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FileTypeFilter = "all" | "image" | "video";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedView, setSelectedView] = useState<ViewType>("all");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [dragOverMain, setDragOverMain] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const moveMedia = useMoveMedia();

  // Determine folder ID from view
  const folderId = selectedView === "all" ? undefined
    : selectedView === "unfiled" ? null
    : selectedView === "starred" ? undefined
    : selectedView === "recent" ? undefined
    : selectedView;

  const isSpecialView = ["all", "unfiled", "starred", "recent"].includes(selectedView);

  const { data: regularMedia = [], isLoading } = useMedia(
    isSpecialView && selectedView !== "starred" && selectedView !== "recent" ? folderId : (isSpecialView ? undefined : folderId),
    search || undefined
  );
  const { data: starredMedia = [] } = useStarredMedia();
  const { data: recentMedia = [] } = useRecentMedia();
  const { data: folders = [] } = useFolders();

  // Pick media based on view, then apply file type filter
  const rawMedia = selectedView === "starred" ? starredMedia
    : selectedView === "recent" ? recentMedia
    : regularMedia;

  const media = fileTypeFilter === "all" ? rawMedia
    : rawMedia.filter(m => m.file_type === fileTypeFilter);

  const currentFolder = !isSpecialView ? folders.find(f => f.id === selectedView) : null;
  const pageTitle = selectedView === "all" ? "All Files"
    : selectedView === "unfiled" ? "Unfiled"
    : selectedView === "starred" ? "Starred"
    : selectedView === "recent" ? "Recent"
    : currentFolder?.name || "Folder";

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  // Listen for drag-drop move events from sidebar
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

  // Drag & drop upload on main area
  const handleMainDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMain(false);
    if (e.dataTransfer.files.length > 0) {
      setUploadOpen(true);
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar selectedView={selectedView} onSelectView={setSelectedView} />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 h-14 flex items-center gap-3 shadow-sm">
            <SidebarTrigger className="shrink-0" />

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* File type filter */}
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
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

            <div className="flex items-center gap-1 ml-auto">
              {/* View mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                title={viewMode === "grid" ? "Switch to list" : "Switch to grid"}
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>

              {/* Dark mode toggle */}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button onClick={() => setUploadOpen(true)} size="sm">
                <Upload className="h-4 w-4 mr-1.5" />
                Upload
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">{user?.email}</DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main
            className={`flex-1 p-6 ${dragOverMain ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
            onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes("Files")) setDragOverMain(true); }}
            onDragLeave={() => setDragOverMain(false)}
            onDrop={handleMainDrop}
          >
            <div className="mb-6">
              {!isSpecialView && (
                <FolderBreadcrumb
                  folderId={selectedView}
                  folders={folders}
                  onNavigate={setSelectedView}
                />
              )}
              <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
              {!isLoading && <p className="text-sm text-muted-foreground mt-1">{media.length} file{media.length !== 1 ? "s" : ""}</p>}
            </div>

            <MediaGrid
              media={media}
              loading={isLoading && selectedView !== "starred" && selectedView !== "recent"}
              onPreview={(m) => setPreviewIndex(media.findIndex(x => x.id === m.id))}
              viewMode={viewMode}
            />
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
    </SidebarProvider>
  );
}
