import { useState, useCallback, useEffect, useRef } from "react";
import { Media, getPublicUrl } from "@/hooks/useMedia";
import { useAllProfiles } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Link, User, MessageCircleHeart, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoveNotesPanel } from "@/components/LoveNotesPanel";
import { TagsPanel } from "@/components/TagsPanel";
import { cn, formatSize } from "@/lib/utils";

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

function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function MediaPreview({ media, currentIndex, open, onOpenChange, onNavigate }: Props) {
  const item = media[currentIndex] ?? null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < media.length - 1;
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const { data: profiles = [] } = useAllProfiles();
  const { toast } = useToast();

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const uploaderMap = Object.fromEntries(profiles.map(p => [p.user_id, p.display_name ?? null]));

  const goPrev = useCallback(() => { if (currentIndex > 0) onNavigate(currentIndex - 1); }, [currentIndex, onNavigate]);
  const goNext = useCallback(() => { if (currentIndex < media.length - 1) onNavigate(currentIndex + 1); }, [currentIndex, media.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goPrev, goNext]);

  // Reset panels when item changes
  useEffect(() => {
    setShowNotes(false);
    setShowTags(false);
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
    setSwipeDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) return;
    e.preventDefault();
    setSwipeDelta(dx);
  };

  const handleTouchEnd = () => {
    const threshold = 60;
    if (swipeDelta < -threshold && hasNext) goNext();
    else if (swipeDelta > threshold && hasPrev) goPrev();
    setSwipeDelta(0);
    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!item) return null;
  const url = getPublicUrl(item.file_path);
  const uploaderName = uploaderMap[item.uploaded_by];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied to clipboard" });
    });
  };

  const clampedDelta = Math.max(-120, Math.min(120, swipeDelta));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[92dvh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-0 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-6">
              <span className="truncate font-heading text-sm sm:text-base">{item.title}</span>
              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                  {currentIndex + 1} / {media.length}
                </span>
                <Button
                  variant="ghost" size="icon"
                  className={cn("h-8 w-8", showTags && "text-primary bg-primary/10")}
                  onClick={() => { setShowTags(v => !v); setShowNotes(false); }}
                  title="Tags"
                >
                  <Tag className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={cn("h-8 w-8", showNotes && "text-primary bg-primary/10")}
                  onClick={() => { setShowNotes(v => !v); setShowTags(false); }}
                  title="Love Notes"
                >
                  <MessageCircleHeart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyLink} title="Copy link">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadFile(url, item.file_name)} title="Download">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5 pt-3 space-y-4">
          {/* Media with swipe */}
          <div
            className="relative group select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="transition-transform duration-75"
              style={{ transform: isSwiping ? `translateX(${clampedDelta}px)` : "translateX(0)" }}
            >
              {item.file_type === "video" ? (
                <video src={url} controls className="w-full rounded-xl max-h-[50dvh] sm:max-h-[55vh]" autoPlay />
              ) : (
                <img src={url} alt={item.title} className="w-full rounded-xl max-h-[50dvh] sm:max-h-[55vh] object-contain bg-muted/30" />
              )}
            </div>

            {isSwiping && (
              <>
                {swipeDelta < -20 && hasNext && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg pointer-events-none">
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </div>
                )}
                {swipeDelta > 20 && hasPrev && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg pointer-events-none">
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </div>
                )}
              </>
            )}

            {hasPrev && !isSwiping && (
              <Button
                variant="secondary" size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
                onClick={goPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {hasNext && !isSwiping && (
              <Button
                variant="secondary" size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-lg"
                onClick={goNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}

            {media.length > 1 && media.length <= 20 && (
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 pointer-events-none">
                {media.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      i === currentIndex ? "w-4 h-1.5 bg-white shadow" : "w-1.5 h-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="space-y-0.5 text-xs sm:text-sm text-muted-foreground">
            {item.description && <p className="text-foreground text-sm">{item.description}</p>}
            <p>Uploaded {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
            <p>{item.file_name} · {formatSize(item.file_size)} · {item.mime_type}</p>
            {uploaderName && (
              <p className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Uploaded by {uploaderName}
              </p>
            )}
          </div>

          {/* Tags — toggled */}
          {showTags && <TagsPanel mediaId={item.id} />}

          {/* Love Notes — toggled */}
          {showNotes && <LoveNotesPanel mediaId={item.id} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
