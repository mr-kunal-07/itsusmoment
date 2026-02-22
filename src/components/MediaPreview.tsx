import { Media, getPublicUrl } from "@/hooks/useMedia";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect } from "react";

interface Props {
  media: Media[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(1) + " GB";
}

export function MediaPreview({ media, currentIndex, open, onOpenChange, onNavigate }: Props) {
  const item = media[currentIndex] ?? null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < media.length - 1;

  const goPrev = useCallback(() => { if (currentIndex > 0) onNavigate(currentIndex - 1); }, [currentIndex, onNavigate]);
  const goNext = useCallback(() => { if (currentIndex < media.length - 1) onNavigate(currentIndex + 1); }, [currentIndex, media.length, onNavigate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goPrev, goNext]);

  if (!item) return null;
  const url = getPublicUrl(item.file_path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{item.title}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {currentIndex + 1} / {media.length}
              </span>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 relative group">
          {item.file_type === "video" ? (
            <video src={url} controls className="w-full rounded-lg max-h-[60vh]" autoPlay />
          ) : (
            <img src={url} alt={item.title} className="w-full rounded-lg max-h-[60vh] object-contain" />
          )}

          {hasPrev && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
              onClick={goPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
              onClick={goNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 space-y-1 text-sm text-muted-foreground">
          {item.description && <p className="text-foreground">{item.description}</p>}
          <p>Uploaded {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
          <p>{item.file_name} · {formatSize(item.file_size)} · {item.mime_type}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
