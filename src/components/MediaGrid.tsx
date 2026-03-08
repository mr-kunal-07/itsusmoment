import { useState, useCallback, useRef, useEffect } from "react";
import { Play, MoreVertical, Pencil, Trash2, Star, Image as ImageIcon, FolderInput, X, CheckSquare, FolderOpen, Keyboard } from "lucide-react";
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
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const [moveItem, setMoveItem] = useState<Media | null>(null);
  const [singleMoveFolderId, setSingleMoveFolderId] = useState<string>("__none__");
  const moveMedia = useBulkMoveMedia();

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

  const selectAll = useCallback(() => setSelected(new Set(media.map(m => m.id))), [media]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input/textarea/dialog
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).closest("[role=dialog]")) return;

      if (e.key === "Escape") {
        clearSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.size > 0 && !bulkDeleteOpen && !deleteItem && !editItem) {
          setBulkDeleteOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, bulkDeleteOpen, deleteItem, editItem, clearSelection, selectAll]);

  // ── Infinite scroll ─────────────────────────────────────────────────
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
            <Card key={i} className="overflow-hidden break-inside-avoid border-border/50">
              <Skeleton className="w-full" style={{ height: `${150 + (i * 37) % 150}px` }} />
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
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <div className="rounded-full bg-muted p-6 mb-4">
          <ImageIcon className="h-10 w-10 opacity-40" />
        </div>
        <p className="text-base font-medium text-foreground">No files here yet</p>
        <p className="text-sm mt-1">Upload files to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Selection toolbar ─────────────────────────────────────── */}
      {isSelecting && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20 backdrop-blur-sm shadow-sm animate-in slide-in-from-top-1 duration-150">
          <CheckSquare className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground" onClick={selectAll}>
            Select all {media.length}
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                  onClick={() => { setMoveFolderId("__none__"); setBulkMoveOpen(true); }}>
                  <FolderInput className="h-3.5 w-3.5" /> Move
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move selected files</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5"
                  onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete · <kbd className="font-mono">Del</kbd></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear · <kbd className="font-mono">Esc</kbd></TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* ── Keyboard hint (shown only when nothing selected) ──────── */}
      {!isSelecting && media.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground/60 select-none">
          <Keyboard className="h-3 w-3" />
          <span><kbd className="font-mono">Ctrl+A</kbd> select all · <kbd className="font-mono">Del</kbd> delete · <kbd className="font-mono">Esc</kbd> clear</span>
        </div>
      )}

      {/* ── Grid view ─────────────────────────────────────────────── */}
      {viewMode === "grid" ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {media.map(item => {
            const isSelected = selected.has(item.id);
            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                  <Card
                    className={cn(
                      "overflow-hidden group cursor-pointer transition-all duration-200 break-inside-avoid border-border/60",
                      "hover:shadow-lg hover:-translate-y-0.5 hover:border-border",
                      isSelected && "ring-2 ring-primary shadow-md -translate-y-0.5"
                    )}
                    draggable={!isSelecting}
                    onDragStart={e => handleDragStart(e, item)}
                  >
                    <div
                      className="relative bg-muted overflow-hidden"
                      onClick={() => isSelecting ? toggleSelect(item.id) : onPreview(item)}
                    >
                      {item.file_type === "video" ? (
                        <>
                          <video src={getPublicUrl(item.file_path)} className="w-full object-cover" preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                            <div className="rounded-full bg-white/20 backdrop-blur-sm p-3">
                              <Play className="h-8 w-8 text-white fill-white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={getPublicUrl(item.file_path)} alt={item.title} className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                      )}

                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                      {/* Checkbox */}
                      <div
                        className={cn(
                          "absolute top-2 left-2 transition-all duration-150",
                          isSelecting ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                        )}
                        onClick={e => { e.stopPropagation(); toggleSelect(item.id); }}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="h-5 w-5 bg-background/80 backdrop-blur-sm border-white/60 shadow-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>

                      {/* Star */}
                      {!isSelecting && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full"
                          onClick={e => { e.stopPropagation(); handleToggleStar(item); }}
                        >
                          <Star className={cn("h-3.5 w-3.5", item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-white")} />
                        </Button>
                      )}

                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                      )}
                    </div>

                    <div className="p-3 flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate leading-tight">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatSize(item.file_size)} · {format(new Date(item.created_at), "MMM d")}</p>
                      </div>
                      {!isSelecting && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => { setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStar(item)}>
                              <Star className={cn("h-4 w-4 mr-2", item.is_starred && "fill-yellow-400 text-yellow-400")} />
                              {item.is_starred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSingleMoveFolderId(item.folder_id ?? "__none__"); setMoveItem(item); }}>
                              <FolderOpen className="h-4 w-4 mr-2" /> Move to folder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </Card>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-44">
                  <ContextMenuItem onClick={() => { setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit details
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
        /* ── List view ──────────────────────────────────────────── */
        <div className="space-y-1">
          {media.map(item => {
            const isSelected = selected.has(item.id);
            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group transition-all duration-150",
                      "hover:bg-muted/70 border border-transparent hover:border-border/50",
                      isSelected && "bg-primary/8 border-primary/20 hover:bg-primary/10 hover:border-primary/25"
                    )}
                    draggable={!isSelecting}
                    onDragStart={e => handleDragStart(e, item)}
                    onClick={() => isSelecting ? toggleSelect(item.id) : onPreview(item)}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "shrink-0 transition-all duration-150",
                        isSelecting ? "opacity-100 w-5" : "opacity-0 w-0 group-hover:opacity-100 group-hover:w-5"
                      )}
                      onClick={e => { e.stopPropagation(); toggleSelect(item.id); }}
                    >
                      <Checkbox checked={isSelected} className="data-[state=checked]:bg-primary" />
                    </div>

                    {/* Thumbnail */}
                    <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 relative shadow-sm">
                      {item.file_type === "video" ? (
                        <>
                          <video src={getPublicUrl(item.file_path)} className="w-full h-full object-cover" preload="metadata" />
                          <Play className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                        </>
                      ) : (
                        <img src={getPublicUrl(item.file_path)} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatSize(item.file_size)} · {format(new Date(item.created_at), "MMM d, yyyy")}</p>
                    </div>

                    {item.is_starred && (
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                    )}

                    {!isSelecting && (
                      <>
                        <Button
                          variant="ghost" size="icon"
                          className={cn("h-7 w-7 shrink-0 transition-opacity", item.is_starred ? "opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100")}
                          onClick={e => { e.stopPropagation(); handleToggleStar(item); }}
                        >
                          <Star className={cn("h-4 w-4", item.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleToggleStar(item); }}>
                              <Star className={cn("h-4 w-4 mr-2", item.is_starred && "fill-yellow-400 text-yellow-400")} />
                              {item.is_starred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setSingleMoveFolderId(item.folder_id ?? "__none__"); setMoveItem(item); }}>
                              <FolderOpen className="h-4 w-4 mr-2" /> Move to folder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setDeleteItem(item); }} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-44">
                  <ContextMenuItem onClick={() => { setEditTitle(item.title); setEditDesc(item.description || ""); setEditItem(item); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit details
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
      )}

      {hasMore && <div ref={sentinelRef} className="h-10" />}

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit details</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus /></div>
            <div className="space-y-2"><Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMedia.isPending}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Single Delete ─────────────────────────────────────────── */}
      <AlertDialog open={!!deleteItem} onOpenChange={open => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <strong>"{deleteItem?.title}"</strong>. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Bulk Delete ───────────────────────────────────────────── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} file{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected files. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDelete.isPending} className="bg-destructive hover:bg-destructive/90">
              Delete {selected.size} file{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Single Move Dialog ────────────────────────────────────── */}
      <Dialog open={!!moveItem} onOpenChange={open => !open && setMoveItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Move to folder</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Destination</Label>
            <Select value={singleMoveFolderId} onValueChange={setSingleMoveFolderId}>
              <SelectTrigger><SelectValue placeholder="Choose folder…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No folder (root)</SelectItem>
                {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveItem(null)}>Cancel</Button>
            <Button onClick={handleSingleMove} disabled={moveMedia.isPending}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Move Dialog ──────────────────────────────────────── */}
      <Dialog open={bulkMoveOpen} onOpenChange={setBulkMoveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Move {selected.size} file{selected.size !== 1 ? "s" : ""}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Destination</Label>
            <Select value={moveFolderId} onValueChange={setMoveFolderId}>
              <SelectTrigger><SelectValue placeholder="Choose folder…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No folder (root)</SelectItem>
                {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
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
