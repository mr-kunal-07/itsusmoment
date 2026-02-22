import { useState } from "react";
import { Search, Upload, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMedia, Media } from "@/hooks/useMedia";
import { useFolders } from "@/hooks/useFolders";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MediaGrid } from "@/components/MediaGrid";
import { UploadDialog } from "@/components/UploadDialog";
import { MediaPreview } from "@/components/MediaPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);

  const { data: media = [], isLoading } = useMedia(selectedFolderId, search || undefined);
  const { data: folders = [] } = useFolders();

  const currentFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null;
  const pageTitle = selectedFolderId === undefined ? "All Files" : selectedFolderId === null ? "Unfiled" : currentFolder?.name || "Folder";
  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background border-b px-4 h-14 flex items-center gap-3">
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

            <div className="flex items-center gap-2 ml-auto">
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
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
              {!isLoading && <p className="text-sm text-muted-foreground mt-1">{media.length} file{media.length !== 1 ? "s" : ""}</p>}
            </div>

            <MediaGrid media={media} loading={isLoading} onPreview={(m) => setPreviewIndex(media.findIndex(x => x.id === m.id))} />
          </main>
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} folderId={selectedFolderId} />
      <MediaPreview media={media} currentIndex={previewIndex} open={previewIndex >= 0} onOpenChange={open => !open && setPreviewIndex(-1)} onNavigate={setPreviewIndex} />
    </SidebarProvider>
  );
}
