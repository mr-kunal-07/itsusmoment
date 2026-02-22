import { useState, useCallback, useRef, useEffect } from "react";
import { Play, MoreVertical, Pencil, Trash2, Star, Image as ImageIcon, List, LayoutGrid } from "lucide-react";
import { Media, getPublicUrl, useDeleteMedia, useUpdateMedia, useToggleStar } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface Props {
  media: Media[];
  loading: boolean;
  onPreview: (m: Media) => void;
  viewMode: ViewMode;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(1) + " GB";
}

export function MediaGrid({ media, loading, onPreview, viewMode, hasMore, onLoadMore }: Props) {
  const deleteMedia = useDeleteMedia();
  const updateMedia = useUpdateMedia();
  const toggleStar = useToggleStar();
  const { toast } = useToast();

  const [editItem, setEditItem] = useState<Media | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteItem, setDeleteItem] = useState<Media | null>(null);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) onLoadMore(); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const handleEdit = async () => {
    if (!editItem || !editTitle.trim()) return;
    try {
      await updateMedia.mutateAsync({ id: editItem.id, title: editTitle.trim(), description: editDesc });
      setEditItem(null);
      toast({ title: "Updated" });
    } catch {
      toast({ title: "Error updating", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMedia.mutateAsync({ id: deleteItem.id, filePath: deleteItem.file_path });
      setDeleteItem(null);
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  };

  const handleToggleStar = async (item: Media) => {
    try {
      await toggleStar.mutateAsync({ id: item.id, starred: !item.is_starred });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDragStart = (e: React.DragEvent, item: Media) => {
    e.dataTransfer.setData("media-id", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  if (loading) {
    return (
      <div className={cn(
        viewMode === "grid"
          ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
          : "space-y-2"
      )}>
        {Array.from({ length: 8 }).map((_, i) => (
          viewMode === "grid" ? (
            <Card key={i} className="overflow-hidden break-inside-avoid">
              <Skeleton className="w-full" style={{ height: `${150 + Math.random() * 150}px` }} />
              <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </Card>
          ) : (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          )
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No files here yet</p>
        <p className="text-sm">Upload files to get started</p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "grid" ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {media.map(item => (
            <Card
              key={item.id}
              className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow break-inside-avoid"
              draggable
              onDragStart={e => handleDragStart(e, item)}
            >
              <div className="relative bg-muted" onClick={() => onPreview(item)}>
                {item.file_type === "video" ? (
                  <>
                    <video src={getPublicUrl(item.file_path)} className="w-full object-cover" preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="h-10 w-10 text-white fill-white/80" />
                    </div>
                  </>
                ) : (
                  <img src={getPublicUrl(item.file_path)} alt={item.title} className="w-full object-cover" loading="lazy" />
                )}
                {/* Star button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-black/50"
                  onClick={e => { e.stopPropagation(); handleToggleStar(item); }}
                >
                  <Star className={cn("h-4 w-4", item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-white")} />
                </Button>
              </div>
              <div className="p-3 flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(item.file_size)} · {format(new Date(item.created_at), "MMM d")}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStar(item)}>
                      <Star className={cn("h-4 w-4 mr-2", item.is_starred && "fill-yellow-400 text-yellow-400")} />
                      {item.is_starred ? "Unstar" : "Star"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {media.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
              draggable
              onDragStart={e => handleDragStart(e, item)}
              onClick={() => onPreview(item)}
            >
              <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0 relative">
                {item.file_type === "video" ? (
                  <>
                    <video src={getPublicUrl(item.file_path)} className="w-full h-full object-cover" preload="metadata" />
                    <Play className="absolute inset-0 m-auto h-5 w-5 text-white" />
                  </>
                ) : (
                  <img src={getPublicUrl(item.file_path)} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.file_size)} · {format(new Date(item.created_at), "MMM d, yyyy")}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); handleToggleStar(item); }}>
                <Star className={cn("h-4 w-4", item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteItem(item); }} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-10" />}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit details</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMedia.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{deleteItem?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
