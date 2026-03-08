import { useState, useCallback, useRef, useEffect } from "react";
import { Play, MoreVertical, Pencil, Trash2, Star, Image as ImageIcon, FolderInput, X, CheckSquare, FolderOpen } from "lucide-react";
import { Media, getPublicUrl, useDeleteMedia, useUpdateMedia, useToggleStar, useBulkDeleteMedia, useBulkMoveMedia } from "@/hooks/useMedia";
import { useFolders } from "@/hooks/useFolders";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  const bulkDelete = useBulkDeleteMedia();
  const bulkMove = useBulkMoveMedia();
  const { data: folders = [] } = useFolders();
  const { toast } = useToast();

  const [editItem, setEditItem] = useState<Media | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteItem, setDeleteItem] = useState<Media | null>(null);

  // Single file move
  const [moveItem, setMoveItem] = useState<Media | null>(null);
  const [singleMoveFolderId, setSingleMoveFolderId] = useState<string>("__none__");
  const moveMedia = useBulkMoveMedia();

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState<string>("__none__");

  const isSelecting = selected.size > 0;

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => setSelected(new Set(media.map(m => m.id)));
  const clearSelection = () => setSelected(new Set());

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

  const handleBulkDelete = async () => {
    const items = media.filter(m => selected.has(m.id)).map(m => ({ id: m.id, filePath: m.file_path }));
    try {
      await bulkDelete.mutateAsync(items);
      clearSelection();
      setBulkDeleteOpen(false);
      toast({ title: `Deleted ${items.length} file${items.length !== 1 ? "s" : ""}` });
    } catch {
      toast({ title: "Error deleting files", variant: "destructive" });
    }
  };

  const handleBulkMove = async () => {
    const ids = Array.from(selected);
    const folderId = moveFolderId === "__none__" ? null : moveFolderId;
    try {
      await bulkMove.mutateAsync({ ids, folderId });
      clearSelection();
      setBulkMoveOpen(false);
      toast({ title: `Moved ${ids.length} file${ids.length !== 1 ? "s" : ""}` });
    } catch {
      toast({ title: "Error moving files", variant: "destructive" });
    }
  };

  const handleSingleMove = async () => {
    if (!moveItem) return;
    const folderId = singleMoveFolderId === "__none__" ? null : singleMoveFolderId;
    try {
      await moveMedia.mutateAsync({ ids: [moveItem.id], folderId });
      setMoveItem(null);
      toast({ title: "Moved to folder" });
    } catch {
      toast({ title: "Error moving file", variant: "destructive" });
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
      {/* Bulk selection toolbar */}
      {isSelecting && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <CheckSquare className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <Button variant="ghost" size="sm" className="text-xs h-7 ml-1" onClick={selectAll}>Select all {media.length}</Button>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => { setMoveFolderId("__none__"); setBulkMoveOpen(true); }}
            >
              <FolderInput className="h-3.5 w-3.5" /> Move
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs gap-1.5"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {media.map(item => {
            const isSelected = selected.has(item.id);
            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                <Card
                  className={cn(
                    "overflow-hidden group cursor-pointer hover:shadow-md transition-shadow break-inside-avoid",
                    isSelected && "ring-2 ring-primary"
                  )}
                  draggable={!isSelecting}
                  onDragStart={e => handleDragStart(e, item)}
                >
                <div
                  className="relative bg-muted"
                  onClick={() => isSelecting ? toggleSelect(item.id) : onPreview(item)}
                >
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
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "absolute top-2 left-2 transition-opacity",
                      isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={e => { e.stopPropagation(); toggleSelect(item.id); }}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="bg-background/80 border-white data-[state=checked]:bg-primary"
                    />
                  </div>
                  {/* Star button */}
                  {!isSelecting && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-black/50"
                      onClick={e => { e.stopPropagation(); handleToggleStar(item); }}
                    >
                      <Star className={cn("h-4 w-4", item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-white")} />
                    </Button>
                  )}
                </div>
                <div className="p-3 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(item.file_size)} · {format(new Date(item.created_at), "MMM d")}</p>
                  </div>
                  {!isSelecting && (
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
                        <DropdownMenuItem onClick={() => { setSingleMoveFolderId(item.folder_id ?? "__none__"); setMoveItem(item); }}>
                          <FolderOpen className="h-4 w-4 mr-2" /> Move to folder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                </Card>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => { setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleToggleStar(item)}>
                    <Star className={cn("h-4 w-4 mr-2", item.is_starred && "fill-yellow-400 text-yellow-400")} />
                    {item.is_starred ? "Unstar" : "Star"}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => { setSingleMoveFolderId(item.folder_id ?? "__none__"); setMoveItem(item); }}>
                    <FolderOpen className="h-4 w-4 mr-2" /> Move to folder
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => setDeleteItem(item)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {media.map(item => {
            const isSelected = selected.has(item.id);
            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                <div
                  className={cn(
                  "flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors",
                  isSelected && "bg-primary/10 hover:bg-primary/15"
                )}
                draggable={!isSelecting}
                onDragStart={e => handleDragStart(e, item)}
                onClick={() => isSelecting ? toggleSelect(item.id) : onPreview(item)}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "shrink-0 transition-opacity",
                    isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={e => { e.stopPropagation(); toggleSelect(item.id); }}
                >
                  <Checkbox checked={isSelected} className="data-[state=checked]:bg-primary" />
                </div>
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
                {!isSelecting && (
                  <>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); handleToggleStar(item); }}>
                      <Star className={cn("h-4 w-4", item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setSingleMoveFolderId(item.folder_id ?? "__none__"); setMoveItem(item); }}>
                          <FolderOpen className="h-4 w-4 mr-2" /> Move to folder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteItem(item); }} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            );
          })}
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

      {/* Single Delete Dialog */}
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

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} file{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected files. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDelete.isPending}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Move Dialog */}
      <Dialog open={!!moveItem} onOpenChange={open => !open && setMoveItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move "{moveItem?.title}"</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Destination folder</Label>
            <Select value={singleMoveFolderId} onValueChange={setSingleMoveFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose folder…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No folder (root)</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>Cancel</Button>
            <Button onClick={handleSingleMove} disabled={moveMedia.isPending}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Dialog */}
      <Dialog open={bulkMoveOpen} onOpenChange={setBulkMoveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move {selected.size} file{selected.size !== 1 ? "s" : ""}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Destination folder</Label>
            <Select value={moveFolderId} onValueChange={setMoveFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose folder…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No folder (root)</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkMove} disabled={bulkMove.isPending}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
