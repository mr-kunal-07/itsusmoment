import { useState, useCallback, useRef, memo } from "react";
import { Upload, X, FileImage, FileVideo, CheckCircle2, AlertCircle, CloudUpload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUploadMedia } from "@/hooks/useMedia";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAllProfiles } from "@/hooks/useProfile";
import { sendNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
const ACCEPT_STRING = ALLOWED_TYPES.join(",");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMB(bytes: number): string {
  return (bytes / 1_048_576).toFixed(1) + " MB";
}

function isVideoType(type: string): boolean {
  return type.startsWith("video/");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileEntry {
  file: File;
  /** undefined = pending, true = done, string = error message */
  status: undefined | true | string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

const FileRow = memo(function FileRow({
  entry,
  index,
  uploading,
  onRemove,
}: {
  entry: FileEntry;
  index: number;
  uploading: boolean;
  onRemove: (i: number) => void;
}) {
  const { file, status } = entry;
  const isVideo = isVideoType(file.type);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
        status === true
          ? "bg-emerald-500/8 border border-emerald-500/20"
          : typeof status === "string"
            ? "bg-destructive/8 border border-destructive/20"
            : "bg-muted/60 border border-transparent"
      )}
    >
      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-background border border-border">
        {isVideo ? (
          <FileVideo className="h-4 w-4 text-muted-foreground" aria-hidden />
        ) : (
          <FileImage className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-foreground leading-snug">
          {file.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatMB(file.size)}
          {typeof status === "string" && (
            <span className="text-destructive ml-2">· {status}</span>
          )}
        </p>
      </div>

      {/* Status / remove */}
      {status === true ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-label="Uploaded" />
      ) : typeof status === "string" ? (
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" aria-label="Failed" />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          disabled={uploading}
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
});

// ─── UploadDialog ─────────────────────────────────────────────────────────────

export function UploadDialog({ open, onOpenChange, folderId }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useUploadMedia();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profiles = [] } = useAllProfiles();

  // ── File management ──────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setEntries([]);
    setProgress(0);
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const valid: File[] = [];
      const existingNames = new Set(entries.map((e) => e.file.name));

      Array.from(incoming).forEach((f) => {
        if (existingNames.has(f.name)) return; // deduplicate
        if (!ALLOWED_TYPES.includes(f.type as typeof ALLOWED_TYPES[number])) {
          toast({
            title: `Skipped: ${f.name}`,
            description: "Unsupported format. Use JPG, PNG, WebP, MP4, MOV or WebM.",
            variant: "destructive",
          });
          return;
        }
        if (f.size > MAX_SIZE_BYTES) {
          toast({
            title: `Skipped: ${f.name}`,
            description: "File exceeds the 500 MB limit.",
            variant: "destructive",
          });
          return;
        }
        valid.push(f);
      });

      if (valid.length) {
        setEntries((prev) => [
          ...prev,
          ...valid.map((file): FileEntry => ({ file, status: undefined })),
        ]);
      }
    },
    [entries, toast]
  );

  const removeFile = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Drag & drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the drop zone itself (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const pending = entries.filter((e) => e.status === undefined);
    if (!pending.length) return;

    setUploading(true);
    setProgress(0);

    const allUserIds = profiles.map((p) => p.user_id);
    const uploaderName =
      profiles.find((p) => p.user_id === user?.id)?.display_name ?? "Your partner";

    let done = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.status !== undefined) continue; // skip already-processed

      const title = entry.file.name.replace(/\.[^.]+$/, "");

      try {
        const result = await upload.mutateAsync({
          file: entry.file,
          title,
          folderId,
        });

        // Notify partner
        if (user && allUserIds.length > 1) {
          await sendNotification({
            actorId: user.id,
            allUserIds,
            type: "upload",
            mediaId: (result as any)?.id ?? null,
            message: `${uploaderName} uploaded "${title}" to the vault 📸`,
          });
        }

        setEntries((prev) =>
          prev.map((e, idx) => (idx === i ? { ...e, status: true } : e))
        );
      } catch (err: any) {
        setEntries((prev) =>
          prev.map((e, idx) =>
            idx === i ? { ...e, status: err?.message ?? "Upload failed" } : e
          )
        );
      }

      done++;
      setProgress(Math.round((done / pending.length) * 100));
    }

    const succeeded = entries.filter((_, i) => entries[i]?.status === true).length + done;
    toast({ title: `Uploaded ${done} file${done !== 1 ? "s" : ""}` });

    setUploading(false);

    // Auto-close only if all succeeded
    const hasErrors = entries.some((e) => typeof e.status === "string");
    if (!hasErrors) {
      reset();
      onOpenChange(false);
    }
  }, [entries, folderId, profiles, upload, user, toast, reset, onOpenChange]);

  // ── Derived state ────────────────────────────────────────────────────────

  const pendingCount = entries.filter((e) => e.status === undefined).length;
  const hasEntries = entries.length > 0;

  const handleClose = useCallback(() => {
    if (uploading) return;
    reset();
    onOpenChange(false);
  }, [uploading, reset, onOpenChange]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) handleClose(); }}
    >
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          // Responsive sizing
          "w-[calc(100vw-2rem)] max-w-lg",
          "max-h-[calc(100dvh-4rem)] sm:max-h-[90vh]",
          "rounded-2xl border border-border/60",
        )}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
              <CloudUpload className="h-4 w-4 text-primary" aria-hidden />
            </span>
            Upload Media
          </DialogTitle>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 flex flex-col gap-4 px-5 py-4 min-h-0 overflow-hidden">

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Click or drag files to upload"
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2",
              "rounded-xl border-2 border-dashed",
              "px-4 py-7 text-center cursor-pointer",
              "transition-all duration-200 select-none",
              dragOver
                ? "border-primary bg-primary/6 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/40"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            {/* Animated upload icon */}
            <span
              className={cn(
                "flex items-center justify-center h-12 w-12 rounded-2xl mb-1",
                "bg-primary/10 transition-transform duration-200",
                dragOver && "scale-110"
              )}
            >
              <Upload
                className={cn(
                  "h-6 w-6 text-primary transition-transform duration-200",
                  dragOver && "-translate-y-0.5"
                )}
                aria-hidden
              />
            </span>

            <p className="text-sm font-semibold text-foreground">
              {dragOver ? "Drop to add files" : "Drag & drop or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
              JPG, PNG, WebP, MP4, MOV, WebM · Up to 500 MB each · Multiple files supported
            </p>

            <input
              ref={inputRef}
              id="file-input-multi"
              type="file"
              className="sr-only"
              accept={ACCEPT_STRING}
              multiple
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* File list */}
          {hasEntries && (
            <ScrollArea className="flex-1 min-h-0 -mx-1 px-1">
              <div className="space-y-1.5 pb-1">
                {entries.map((entry, i) => (
                  <FileRow
                    key={`${entry.file.name}-${i}`}
                    entry={entry}
                    index={i}
                    uploading={uploading}
                    onRemove={removeFile}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span className="font-medium text-foreground tabular-nums">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className="h-1.5 rounded-full"
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-5 pb-5 pt-3 border-t border-border/60 shrink-0 flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none rounded-xl h-10"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 sm:flex-none rounded-xl h-10 gap-2"
            onClick={handleSubmit}
            disabled={!pendingCount || uploading}
          >
            {uploading ? (
              <>Uploading… {progress}%</>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" aria-hidden />
                Upload {pendingCount > 0 ? `${pendingCount} file${pendingCount !== 1 ? "s" : ""}` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UploadDialog;