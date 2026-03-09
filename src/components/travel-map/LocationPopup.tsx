import { useState } from "react";
import { X, MapPin, Calendar, Trash2, FolderOpen, ChevronLeft, ChevronRight, CheckCircle2, ExternalLink } from "lucide-react";
import { TravelLocation, useDeleteTravelLocation, useUpdateTravelLocation } from "@/hooks/useTravelLocations";
import { useFolders } from "@/hooks/useFolders";
import { useMedia, getPublicUrl } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  location: TravelLocation | null;
  onClose: () => void;
}

export function LocationPopup({ location, onClose }: Props) {
  const { toast } = useToast();
  const deleteLocation = useDeleteTravelLocation();
  const updateLocation = useUpdateTravelLocation();
  const { data: folders = [] } = useFolders();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch folder media only when a folder is linked
  const { data: folderMedia = [] } = useMedia(
    location?.folder_id ?? undefined,
    undefined
  );

  if (!location) return null;

  const linkedFolder = location.folder_id ? folders.find(f => f.id === location.folder_id) : null;

  // Merge location's own photo_urls + folder media public URLs (images only, deduped)
  const ownPhotos = location.photo_urls ?? [];
  const folderPhotos = folderMedia
    .filter(m => m.file_type === "image")
    .map(m => getPublicUrl(m.file_path));
  const allPhotos = [...ownPhotos, ...folderPhotos.filter(u => !ownPhotos.includes(u))];
  const hasPhotos = allPhotos.length > 0;

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync(location.id);
      toast({ title: "Location removed" });
      onClose();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleVisited = async () => {
    try {
      await updateLocation.mutateAsync({ id: location.id, visited: !location.visited });
      toast({ title: location.visited ? "Marked as not visited" : "✅ Marked as visited!" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={location.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Photo area */}
          {hasPhotos ? (
            <div className="relative h-44 bg-muted overflow-hidden">
              <img
                src={photos[photoIndex]}
                alt={location.location_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div key={i} className={cn("h-1.5 rounded-full transition-all", i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50")} />
                    ))}
                  </div>
                </>
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative h-16 bg-muted/50 flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5">
                  {location.visited && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {location.location_name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(location.city || location.country) && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[location.city, location.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {location.date_visited && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(location.date_visited), "MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete */}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="h-7 w-7 rounded-lg bg-muted hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="flex gap-1 items-center shrink-0">
                  <span className="text-[10px] text-destructive">Delete?</span>
                  <button onClick={handleDelete} className="px-2 py-1 text-[10px] rounded bg-destructive/20 text-destructive font-medium">Yes</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-[10px] rounded bg-muted text-muted-foreground">No</button>
                </div>
              )}
            </div>

            {/* Description */}
            {location.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{location.description}</p>
            )}

            {/* Linked folder */}
            {linkedFolder && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium text-foreground">{linkedFolder.emoji ? `${linkedFolder.emoji} ` : ""}{linkedFolder.name}</span>
                <span className="opacity-60">— photos linked to this folder</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant={location.visited ? "outline" : "default"}
                size="sm"
                className={cn("flex-1 text-xs gap-1.5", location.visited && "border-green-500/40 text-green-600")}
                onClick={handleToggleVisited}
                disabled={updateLocation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {location.visited ? "Visited ✓" : "Mark Visited"}
              </Button>

              <a
                href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Maps
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
