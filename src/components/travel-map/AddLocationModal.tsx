import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  MapPin, Calendar, FolderOpen, Search, Loader2, CheckCircle2, Circle, X, ImagePlus,
} from "lucide-react";
import type { ReverseGeoResult } from "./TravelMapCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddTravelLocation } from "@/hooks/useTravelLocations";
import { useFolders } from "@/hooks/useFolders";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string; town?: string; village?: string;
    county?: string; country?: string; state?: string;
  };
}

interface FormState {
  location_name: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  date_visited: string;
  description: string;
}

const INITIAL_FORM: FormState = {
  location_name: "",
  city: "",
  country: "",
  latitude: "",
  longitude: "",
  date_visited: "",
  description: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  /** Reverse-geocode result from map click — auto-fills city, country, place name */
  initialGeo?: ReverseGeoResult;
}

// ─── GeoSearch ────────────────────────────────────────────────────────────────

interface GeoSearchProps {
  onSelect: (result: GeoResult) => void;
  clearOnClose: boolean;
}

const GeoSearch = memo(function GeoSearch({ onSelect, clearOnClose }: GeoSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear on modal close
  useEffect(() => {
    if (clearOnClose) { setQuery(""); setResults([]); setShow(false); }
  }, [clearOnClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setShow(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en", "User-Agent": "usMoment-App/1.0" } }
        );
        const data: GeoResult[] = await res.json();
        setResults(data);
        setShow(data.length > 0);
      } catch { /* silent */ } finally { setLoading(false); }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((r: GeoResult) => {
    setQuery(r.display_name.split(",").slice(0, 2).join(", "));
    setShow(false);
    onSelect(r);
  }, [onSelect]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Search a place</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" aria-hidden />
        )}
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShow(true)}
          placeholder="e.g. Goa, India"
          className="pl-9 pr-9"
          aria-label="Search location"
          aria-autocomplete="list"
          aria-expanded={show}
        />

        {/* Suggestions dropdown */}
        {show && results.length > 0 && (
          <div
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
          >
            {results.map((r, i) => {
              const [first, ...rest] = r.display_name.split(",");
              return (
                <button
                  key={i}
                  role="option"
                  type="button"
                  onClick={() => handleSelect(r)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent transition-colors",
                    i > 0 && "border-t border-border/60"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{first}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{rest.slice(0, 2).join(",").trim()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

// ─── PhotoUploader ────────────────────────────────────────────────────────────

interface PhotoUploaderProps {
  urls: string[];
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
}

const PhotoUploader = memo(function PhotoUploader({ urls, uploading, onUpload, onRemove }: PhotoUploaderProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Photos</Label>

      <label className={cn(
        "flex flex-col items-center justify-center gap-1.5 h-16",
        "border border-dashed border-border rounded-xl",
        "bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors",
      )}>
        <input
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={e => e.target.files?.length && onUpload(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-label="Uploading" />
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ImagePlus className="h-3.5 w-3.5" aria-hidden />
            Click to add photos
          </span>
        )}
      </label>

      {urls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {urls.map((url, i) => (
            <div key={i} className="relative group h-14 w-14 rounded-lg overflow-hidden border border-border shrink-0">
              <img src={url} alt={`Uploaded photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="h-3.5 w-3.5 text-white" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── AddLocationModal ─────────────────────────────────────────────────────────

export function AddLocationModal({ open, onClose, initialLat, initialLng, initialGeo }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addLocation = useAddTravelLocation();
  const { data: folders = [] } = useFolders();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [visited, setVisited] = useState(false);
  const [folderId, setFolderId] = useState<string>("none");
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [clearSearch, setClearSearch] = useState(false);

  // Sync initial coordinates when map is clicked
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      setForm(f => ({
        ...f,
        latitude: initialLat.toFixed(6),
        longitude: initialLng.toFixed(6),
      }));
    }
  }, [initialLat, initialLng]);

  // Apply reverse-geocode result when it arrives from map click
  useEffect(() => {
    if (!initialGeo) return;
    setForm(f => ({
      ...f,
      city: initialGeo.city || f.city,
      country: initialGeo.country || f.country,
      // Only pre-fill name if user hasn't typed one yet
      location_name: f.location_name || initialGeo.display || "",
    }));
  }, [initialGeo]);

  // Trigger GeoSearch clear on close
  useEffect(() => {
    setClearSearch(!open);
  }, [open]);

  const reset = useCallback(() => {
    setForm(INITIAL_FORM);
    setVisited(false);
    setFolderId("none");
    setPhotoUrls([]);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  // ── Geo search result ──────────────────────────────────────────────────────

  const handleGeoSelect = useCallback((r: GeoResult) => {
    const city = r.address.city || r.address.town || r.address.village || r.address.county || "";
    const country = r.address.country || "";
    const name = r.display_name.split(",")[0].trim();
    setForm(f => ({
      ...f,
      location_name: f.location_name || name,
      city,
      country,
      latitude: parseFloat(r.lat).toFixed(6),
      longitude: parseFloat(r.lon).toFixed(6),
    }));
  }, []);

  // ── Photo upload ───────────────────────────────────────────────────────────

  const handlePhotoUpload = useCallback(async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `travel/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }

    setPhotoUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
  }, [user]);

  const handlePhotoRemove = useCallback((index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.location_name.trim() || !form.latitude || !form.longitude) {
      toast({ title: "Please enter a location name and pin it on the map", variant: "destructive" });
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
        photo_urls: photoUrls,
        tags: [],
        visited,
        folder_id: folderId === "none" ? undefined : folderId,
      });

      toast({ title: visited ? "✅ Location marked as visited!" : "📍 Location pinned to your map!" });
      handleClose();
    } catch {
      toast({ title: "Failed to add location", variant: "destructive" });
    }
  }, [form, visited, folderId, photoUrls, addLocation, toast, handleClose]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0",
          "w-[calc(100vw-2rem)] max-w-md",
          "max-h-[calc(100dvh-4rem)] sm:max-h-[90vh]",
          "rounded-2xl",
        )}
      >
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
            </span>
            Pin a Place
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable form body */}
        <form
          id="add-location-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0"
        >
          {/* Geo search */}
          <GeoSearch onSelect={handleGeoSelect} clearOnClose={clearSearch} />

          {/* Place name */}
          <div className="space-y-1.5">
            <Label htmlFor="loc-name" className="text-xs text-muted-foreground">Place name *</Label>
            <Input
              id="loc-name"
              value={form.location_name}
              onChange={e => setField("location_name", e.target.value)}
              placeholder="e.g. Goa Beach Trip"
              required
            />
          </div>

          {/* City + Country */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loc-city" className="text-xs text-muted-foreground">City</Label>
              <Input id="loc-city" value={form.city} onChange={e => setField("city", e.target.value)} placeholder="Goa" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-country" className="text-xs text-muted-foreground">Country</Label>
              <Input id="loc-country" value={form.country} onChange={e => setField("country", e.target.value)} placeholder="India" />
            </div>
          </div>

          {/* Coordinates hint */}
          {(form.latitude || form.longitude) && (
            <p className="text-[10px] text-muted-foreground" aria-live="polite">
              📍 {form.latitude}, {form.longitude}
              <span className="ml-1 opacity-60">— tap the map to change</span>
            </p>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="loc-date" className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" aria-hidden /> Date visited
            </Label>
            <Input
              id="loc-date"
              type="date"
              value={form.date_visited}
              onChange={e => setField("date_visited", e.target.value)}
              className="[color-scheme:auto]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="loc-desc" className="text-xs text-muted-foreground">Memory note</Label>
            <Textarea
              id="loc-desc"
              value={form.description}
              onChange={e => setField("description", e.target.value)}
              placeholder="Describe this memory…"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Visited toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={visited}
            onClick={() => setVisited(v => !v)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
              visited
                ? "border-green-500/50 bg-green-500/8 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            {visited
              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" aria-hidden />
              : <Circle className="h-4 w-4 shrink-0" aria-hidden />
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
                <FolderOpen className="h-3 w-3" aria-hidden /> Link to folder
                <span className="opacity-50">(optional)</span>
              </Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Choose a folder…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.emoji ? `${f.emoji} ` : ""}{f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Photos will be stored in this folder</p>
            </div>
          )}

          {/* Photo upload */}
          <PhotoUploader
            urls={photoUrls}
            uploading={uploading}
            onUpload={handlePhotoUpload}
            onRemove={handlePhotoRemove}
          />
        </form>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-border flex gap-3">
          <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-location-form"
            disabled={addLocation.isPending || uploading}
            className="flex-1 rounded-xl gap-2"
          >
            {addLocation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              : <MapPin className="h-4 w-4" aria-hidden />
            }
            {visited ? "Pin as Visited" : "Pin Location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddLocationModal;