import { useState, useCallback } from "react";
import { Upload, X, FileImage, FileVideo } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUploadMedia } from "@/hooks/useMedia";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE = 500 * 1024 * 1024;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
}

export function UploadDialog({ open, onOpenChange, folderId }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const upload = useUploadMedia();
  const { toast } = useToast();

  const reset = () => {
    setFiles([]);
    setProgress(0);
  };

  const addFiles = (incoming: FileList | File[]) => {
    const valid: File[] = [];
    Array.from(incoming).forEach(f => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast({ title: `Skipped: ${f.name}`, description: "Unsupported format.", variant: "destructive" });
        return;
      }
      if (f.size > MAX_SIZE) {
        toast({ title: `Skipped: ${f.name}`, description: "File too large (max 500 MB).", variant: "destructive" });
        return;
      }
      valid.push(f);
    });
    if (valid.length) setFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []);

  const handleSubmit = async () => {
    if (!files.length) return;
    setUploading(true);
    let done = 0;
    for (const file of files) {
      const title = file.name.replace(/\.[^.]+$/, "");
      try {
        await upload.mutateAsync({ file, title, folderId });
      } catch (err: any) {
        toast({ title: `Failed: ${file.name}`, description: err.message, variant: "destructive" });
      }
      done++;
      setProgress(Math.round((done / files.length) * 100));
    }
    toast({ title: `Uploaded ${done} file${done !== 1 ? "s" : ""}` });
    setUploading(false);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o && !uploading) { reset(); onOpenChange(o); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Upload media</DialogTitle></DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input-multi")?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Multiple files · JPG, PNG, WebP, MP4, MOV, WebM · Max 500 MB each</p>
          <input
            id="file-input-multi"
            type="file"
            className="hidden"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {files.length > 0 && (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  {f.type.startsWith("video/") ? <FileVideo className="h-6 w-6 text-muted-foreground shrink-0" /> : <FileImage className="h-6 w-6 text-muted-foreground shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.size / 1048576).toFixed(1)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); removeFile(i); }} disabled={uploading}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {uploading && <Progress value={progress} className="h-2" />}

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!files.length || uploading}>
            {uploading ? `Uploading... ${progress}%` : `Upload ${files.length} file${files.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
