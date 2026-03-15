import { useState, useCallback, memo } from "react";
import {
  X, MapPin, Calendar, Trash2, FolderOpen,
  ChevronLeft, ChevronRight, CheckCircle2, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { TravelLocation, useDeleteTravelLocation, useUpdateTravelLocation } from "@/hooks/useTravelLocations";
import { useFolders } from "@/hooks/useFolders";
import { useMedia, getPublicUrl } from "@/hooks/useMedia";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  location: TravelLocation | null;
  onClose: () => void;
}

// ─── PhotoCarousel ────────────────────────────────────────────────────────────

interface CarouselProps {
  photos: string[];
  locationName: string;
  onClose: () => void;
}

const PhotoCarousel = memo(function PhotoCarousel({ photos, locationName, onClose }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const prev = useCallback(() => setIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % photos.length), [photos.length]);

  return (
    <div className="relative h-44 bg-muted overflow-hidden">
      <img
        src={photos[index]}
        alt={`${locationName} — photo ${index + 1} of ${photos.length}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1" aria-hidden>
            {photos.map((_, i) => (
              <div
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-white" : "w-1.5 bg-white/50")}
              />
            ))}
          </div>
        </>
      )}

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
});

// ─── DeleteConfirm ────────────────────────────────────────────────────────────

interface DeleteProps {
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}

const DeleteConfirm = memo(function DeleteConfirm({ onConfirm, onCancel, pending }: DeleteProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] text-destructive font-medium">Delete?</span>
      <button
        onClick={onConfirm}
        disabled={pending}
        className="px-2 py-1 text-[10px] rounded-md bg-destructive/20 text-destructive font-semibold hover:bg-destructive/30 transition-colors disabled:opacity-50"
      >
        Yes
      </button>
      <button
        onClick={onCancel}
        className="px-2 py-1 text-[10px] rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        No
      </button>
    </div>
  );
});

// ─── LocationPopup ────────────────────────────────────────────────────────────

export const LocationPopup = memo(function LocationPopup({ location, onClose }: Props) {
  const { toast } = useToast();
  const deleteLocation = useDeleteTravelLocation();
  const updateLocation = useUpdateTravelLocation();
  const { data: folders = [] } = useFolders();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch folder media (runs only when there's a linked folder)
  const { data: folderMedia = [] } = useMedia(location?.folder_id ?? undefined, undefined);

  const handleDelete = useCallback(async () => {
    if (!location) return;
    try {
      await deleteLocation.mutateAsync(location.id);
      toast({ title: "Location removed" });
      onClose();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }, [location, deleteLocation, toast, onClose]);

  const handleToggleVisited = useCallback(async () => {
    if (!location) return;
    try {
      await updateLocation.mutateAsync({ id: location.id, visited: !location.visited });
      toast({ title: location.visited ? "Marked as not visited" : "✅ Marked as visited!" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }, [location, updateLocation, toast]);

  if (!location) return null;

  const linkedFolder = location.folder_id ? folders.find(f => f.id === location.folder_id) : null;

  const ownPhotos = location.photo_urls ?? [];
  const folderPhotos = folderMedia.filter(m => m.file_type === "image").map(m => getPublicUrl(m.file_path));
  const allPhotos = [...ownPhotos, ...folderPhotos.filter(u => !ownPhotos.includes(u))];
  const hasPhotos = allPhotos.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        key={location.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 mb-14 sm:mb-0"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={location.location_name}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Photo carousel / placeholder header */}
          {hasPhotos ? (
            <PhotoCarousel photos={allPhotos} locationName={location.location_name} onClose={onClose} />
          ) : (
            <div className="relative h-14 bg-muted/40 flex items-center justify-center">
              <span className="text-2xl" aria-hidden>🗺️</span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-3">

            {/* Name + meta + delete */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5 flex-wrap">
                  {location.visited && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" aria-hidden />}
                  {location.location_name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(location.city || location.country) && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {[location.city, location.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {location.date_visited && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" aria-hidden />
                      {format(new Date(location.date_visited), "MMM yyyy")}
                    </span>
                  )}
                </div>
              </div>

              {confirmDelete ? (
                <DeleteConfirm
                  onConfirm={handleDelete}
                  onCancel={() => setConfirmDelete(false)}
                  pending={deleteLocation.isPending}
                />
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete location"
                  className="h-7 w-7 rounded-lg bg-muted hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>

            {/* Description */}
            {location.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{location.description}</p>
            )}

            {/* Linked folder */}
            {linkedFolder && (
              <div className="flex items-center gap-1.5 text-xs bg-muted/50 rounded-lg px-3 py-2">
                <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                <span className="font-medium text-foreground truncate">
                  {linkedFolder.emoji ? `${linkedFolder.emoji} ` : ""}{linkedFolder.name}
                </span>
                <span className="text-muted-foreground opacity-60 shrink-0">
                  — {folderPhotos.length > 0
                    ? `${folderPhotos.length} photo${folderPhotos.length !== 1 ? "s" : ""} from folder`
                    : "no photos in folder yet"}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant={location.visited ? "outline" : "default"}
                size="sm"
                className={cn(
                  "flex-1 text-xs gap-1.5 rounded-lg",
                  location.visited && "border-green-500/40 text-green-600 hover:text-green-700"
                )}
                onClick={handleToggleVisited}
                disabled={updateLocation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {location.visited ? "Visited ✓" : "Mark Visited"}
              </Button>

              <a
                href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in Google Maps"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                Maps
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence >
  );
});

export default LocationPopup;