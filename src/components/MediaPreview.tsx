import { Media, getPublicUrl } from "@/hooks/useMedia";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { X } from "lucide-react";

interface Props {
  media: Media | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(1) + " GB";
}

export function MediaPreview({ media, open, onOpenChange }: Props) {
  if (!media) return null;

  const url = getPublicUrl(media.file_path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>{media.title}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-6">
          {media.file_type === "video" ? (
            <video src={url} controls className="w-full rounded-lg max-h-[60vh]" autoPlay />
          ) : (
            <img src={url} alt={media.title} className="w-full rounded-lg max-h-[60vh] object-contain" />
          )}
        </div>
        <div className="px-6 pb-6 pt-4 space-y-1 text-sm text-muted-foreground">
          {media.description && <p className="text-foreground">{media.description}</p>}
          <p>Uploaded {format(new Date(media.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
          <p>{media.file_name} · {formatSize(media.file_size)} · {media.mime_type}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
