import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Trash2, Edit2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { TravelLocation, useDeleteTravelLocation } from "@/hooks/useTravelLocations";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  location: TravelLocation | null;
  onClose: () => void;
  onEdit?: (location: TravelLocation) => void;
}

export function LocationPopup({ location, onClose, onEdit }: Props) {
  const { toast } = useToast();
  const deleteLocation = useDeleteTravelLocation();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!location) return null;

  const photos = location.photo_urls ?? [];
  const hasPhotos = photos.length > 0;

  const handleDelete = async () => {
    try {
      await deleteLocation.mutateAsync(location.id);
      toast({ title: "📍 Location removed from your map" });
      onClose();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-sm bg-[#0d0818]/95 border border-purple-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{ backdropFilter: "blur(20px)" }}
        >
          {/* Photo carousel */}
          {hasPhotos ? (
            <div className="relative h-44 sm:h-52 bg-black overflow-hidden">
              <img
                src={photos[photoIndex]}
                alt={location.location_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div key={i} className={cn("h-1.5 rounded-full transition-all", i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/40")} />
                    ))}
                  </div>
                </>
              )}
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative h-20 bg-gradient-to-br from-purple-900/60 to-pink-900/40 flex items-center justify-center">
              <div className="text-3xl">🗺️</div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-white leading-tight">{location.location_name} ❤️</h3>
                <div className="flex gap-1 shrink-0">
                  {onEdit && (
                    <button onClick={() => onEdit(location)} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-300 hover:text-white transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} className="h-7 w-7 rounded-lg bg-white/10 hover:bg-red-500/20 flex items-center justify-center text-purple-300 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] text-red-400">Delete?</span>
                      <button onClick={handleDelete} className="px-2 py-1 text-[10px] rounded bg-red-500/30 text-red-300 hover:bg-red-500/50 transition-colors font-medium">Yes</button>
                      <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 text-[10px] rounded bg-white/10 text-white/60 hover:bg-white/20 transition-colors">No</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {(location.city || location.country) && (
                  <span className="flex items-center gap-1 text-[11px] text-purple-300">
                    <MapPin className="h-3 w-3" />
                    {[location.city, location.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {location.date_visited && (
                  <span className="flex items-center gap-1 text-[11px] text-pink-300">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(location.date_visited), "MMMM yyyy")}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {location.description && (
              <p className="text-xs text-white/70 leading-relaxed italic">"{location.description}"</p>
            )}

            {/* Tags */}
            {location.tags && location.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {location.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-[10px] text-pink-200">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { emoji: "📸", value: photos.length, label: "Photos" },
                { emoji: "❤️", value: location.tags?.length ?? 0, label: "Tags" },
                { emoji: "📍", value: "Pin", label: "Saved" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                  <div className="text-base">{stat.emoji}</div>
                  <div className="text-sm font-bold text-white">{stat.value}</div>
                  <div className="text-[9px] text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Open in Maps */}
            <a
              href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-purple-300 hover:text-white transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open in Google Maps
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
