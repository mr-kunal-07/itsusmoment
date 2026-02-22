import { useState, useCallback } from "react";
import { Upload, X, FileImage, FileVideo } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useUploadMedia } from "@/hooks/useMedia";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string | null;
}

export function UploadDialog({ open, onOpenChange, folderId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const upload = useUploadMedia();
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    setTitle("");
    setDescription("");
  };

  const handleFile = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Unsupported format", description: "Use JPG, PNG, WebP, MP4, MOV, or WebM.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 500 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [title]);

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    try {
      await upload.mutateAsync({ file, title: title.trim(), description, folderId });
      toast({ title: "Uploaded successfully" });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Upload media</DialogTitle></DialogHeader>

        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, MP4, MOV, WebM · Max 500 MB</p>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept={ALLOWED_TYPES.join(",")}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {file.type.startsWith("video/") ? <FileVideo className="h-8 w-8 text-muted-foreground shrink-0" /> : <FileImage className="h-8 w-8 text-muted-foreground shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1048576).toFixed(1)} MB</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter a title" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
            </div>
          </div>
        )}

        {upload.isPending && <Progress value={undefined} className="h-2" />}

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || !title.trim() || upload.isPending}>
            {upload.isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
