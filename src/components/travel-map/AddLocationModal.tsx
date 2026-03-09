import { useState, useEffect, useRef } from "react";
import { MapPin, X, Calendar, FolderOpen, Search, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAddTravelLocation } from "@/hooks/useTravelLocations";
import { useFolders } from "@/hooks/useFolders";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string; town?: string; village?: string;
    county?: string; country?: string; state?: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

export function AddLocationModal({ open, onClose, initialLat, initialLng }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addLocation = useAddTravelLocation();
  const { data: folders = [] } = useFolders();

  const [form, setForm] = useState({
    location_name: "",
    city: "",
    country: "",
    latitude: initialLat?.toString() ?? "",
    longitude: initialLng?.toString() ?? "",
    date_visited: "",
    description: "",
  });
  const [visited, setVisited] = useState(false);
  const [folderId, setFolderId] = useState<string>("none");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      setForm(f => ({ ...f, latitude: initialLat.toFixed(6), longitude: initialLng.toFixed(6) }));
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (!open) {
      setSearchQuery(""); setSearchResults([]); setShowSuggestions(false);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]); setShowSuggestions(false); return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "en", "User-Agent": "OurVault-App/1.0" } });
        const data: GeoResult[] = await res.json();
        setSearchResults(data);
        setShowSuggestions(data.length > 0);
      } catch { /* silent */ } finally { setSearchLoading(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleSelectResult = (r: GeoResult) => {
    const city = r.address.city || r.address.town || r.address.village || r.address.county || "";
    const country = r.address.country || "";
    const shortName = r.display_name.split(",")[0].trim();
    setForm(f => ({
      ...f,
      location_name: f.location_name || shortName,
      city, country,
      latitude: parseFloat(r.lat).toFixed(6),
      longitude: parseFloat(r.lon).toFixed(6),
    }));
    setSearchQuery(r.display_name.split(",").slice(0, 2).join(", "));
    setShowSuggestions(false);
  };

  const reset = () => {
    setForm({ location_name: "", city: "", country: "", latitude: "", longitude: "", date_visited: "", description: "" });
    setVisited(false); setFolderId(""); setUploadedUrls([]); setSearchQuery("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `travel/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setUploadedUrls(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location_name.trim() || !form.latitude || !form.longitude) {
      toast({ title: "Please fill in location name and coordinates", variant: "destructive" });
      return;
    }
    try {
      await addLocation.mutateAsync({
        location_name: form.location_name.trim(),
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        date_visited: form.date_visited || undefined,
        description: form.description.trim() || undefined,
        photo_urls: uploadedUrls,
        tags: [],
        visited,
        folder_id: folderId || undefined,
      });
      toast({ title: visited ? "✅ Location marked as visited!" : "📍 Location pinned to your map!" });
      handleClose();
    } catch {
      toast({ title: "Failed to add location", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Pin a Place
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Search */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Search a place</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
              )}
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                placeholder="e.g. Goa, India"
                className="pl-9 pr-9"
              />
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  {searchResults.map((r, i) => {
                    const parts = r.display_name.split(",");
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectResult(r)}
                        className={cn(
                          "w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors",
                          i > 0 && "border-t border-border"
                        )}
                      >
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">{parts[0]}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{parts.slice(1, 3).join(",").trim()}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Location name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Place name *</Label>
            <Input
              value={form.location_name}
              onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
              placeholder="e.g. Goa Beach Trip"
              required
            />
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Goa" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="India" />
            </div>
          </div>

          {/* Coordinates (hidden when auto-filled, shown as read-only hint) */}
          {(form.latitude || form.longitude) && (
            <p className="text-[10px] text-muted-foreground">
              📍 {form.latitude}, {form.longitude}
              <span className="ml-1 opacity-60">— tap the map to change</span>
            </p>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Date visited
            </Label>
            <Input
              type="date"
              value={form.date_visited}
              onChange={e => setForm(f => ({ ...f, date_visited: e.target.value }))}
              className="[color-scheme:auto]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Memory note</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe this memory…"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Visited toggle */}
          <button
            type="button"
            onClick={() => setVisited(v => !v)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
              visited
                ? "border-green-500/50 bg-green-500/8 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            {visited
              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              : <Circle className="h-4 w-4 shrink-0" />
            }
            <div>
              <p className="text-xs font-semibold">{visited ? "Marked as Visited ✓" : "Mark as Visited"}</p>
              <p className="text-[10px] opacity-60">We've been here together</p>
            </div>
          </button>

          {/* Folder link */}
          {folders.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FolderOpen className="h-3 w-3" /> Link to folder (optional)
              </Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Choose a folder…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No folder</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.emoji ? `${f.emoji} ` : ""}{f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Photos you add here will be stored in this folder</p>
            </div>
          )}

          {/* Photo upload */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Photos</Label>
            <label className="flex flex-col items-center justify-center gap-1.5 h-16 border border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => handlePhotoUpload(e.target.files)}
              />
              {uploading ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <p className="text-xs text-muted-foreground">Click to upload photos</p>
              )}
            </label>
            {uploadedUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {uploadedUrls.map((url, i) => (
                  <div key={i} className="h-12 w-12 rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-border flex gap-3">
          <Button type="button" onClick={handleClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addLocation.isPending}
            className="flex-1"
          >
            {addLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
            {visited ? "Pin as Visited" : "Pin Location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
