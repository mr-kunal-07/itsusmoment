import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Calendar, Globe, Tag, Image, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAddTravelLocation } from "@/hooks/useTravelLocations";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    country?: string;
    state?: string;
  };
}

const TAG_OPTIONS = ["Trip", "Anniversary", "Vacation", "Date Night", "Road Trip", "Adventure", "Honeymoon"];

export function AddLocationModal({ open, onClose, initialLat, initialLng }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const addLocation = useAddTravelLocation();

  const [form, setForm] = useState({
    location_name: "",
    city: "",
    country: "",
    latitude: initialLat?.toString() ?? "",
    longitude: initialLng?.toString() ?? "",
    date_visited: "",
    description: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Geocoding state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync initialLat/Lng when props change (map click)
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      setForm(f => ({
        ...f,
        latitude: initialLat.toFixed(6),
        longitude: initialLng.toFixed(6),
      }));
    }
  }, [initialLat, initialLng]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [open]);

  // Debounced geocoding search via Nominatim (free, no API key)
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=6&addressdetails=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en", "User-Agent": "OurVault-App/1.0" },
        });
        const data: GeoResult[] = await res.json();
        setSearchResults(data);
        setShowSuggestions(data.length > 0);
      } catch {
        // silently fail
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  const handleSelectResult = (result: GeoResult) => {
    const city = result.address.city || result.address.town || result.address.village || result.address.county || "";
    const country = result.address.country || "";

    // Build a clean display name (first part of display_name)
    const shortName = result.display_name.split(",")[0].trim();

    setForm(f => ({
      ...f,
      location_name: f.location_name || shortName,
      city,
      country,
      latitude: parseFloat(result.lat).toFixed(6),
      longitude: parseFloat(result.lon).toFixed(6),
    }));
    setSearchQuery(result.display_name.split(",").slice(0, 2).join(", "));
    setShowSuggestions(false);
    setSearchResults([]);
  };

  const reset = () => {
    setForm({ location_name: "", city: "", country: "", latitude: "", longitude: "", date_visited: "", description: "" });
    setSelectedTags([]);
    setUploadedUrls([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

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
        tags: selectedTags,
      });
      toast({ title: "📍 Location pinned to your travel map!" });
      handleClose();
    } catch {
      toast({ title: "Failed to add location", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-lg bg-[#0f0a1a] border border-purple-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-rose-900/50 shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(280,60%,30%,0.3),transparent_70%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Pin a Memory Location</h2>
                    <p className="text-[10px] text-purple-300">Add a place to your travel story</p>
                  </div>
                </div>
                <button onClick={handleClose} className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* ── GEOCODING SEARCH ── */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-purple-200 flex items-center gap-1.5">
                  <Search className="h-3 w-3" /> Search a Place
                  <span className="text-purple-400/60 font-normal">(auto-fills coordinates)</span>
                </Label>
                <div className="relative" ref={suggestionsRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 pointer-events-none" />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 animate-spin" />
                    )}
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                      placeholder="e.g. Goa, India or Paris, France…"
                      className="pl-9 pr-9 bg-white/8 border-pink-500/40 text-white placeholder:text-white/30 focus-visible:ring-pink-500/60"
                    />
                  </div>

                  {/* Suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-purple-500/30 bg-[#1a0d2e] shadow-2xl overflow-hidden"
                      >
                        {searchResults.map((result, i) => {
                          const city = result.address.city || result.address.town || result.address.village || "";
                          const country = result.address.country || "";
                          const parts = result.display_name.split(",");
                          const primary = parts[0].trim();
                          const secondary = parts.slice(1, 3).join(",").trim();
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectResult(result)}
                              className={cn(
                                "w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/8 transition-colors",
                                i > 0 && "border-t border-purple-500/10"
                              )}
                            >
                              <MapPin className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-white truncate">{primary}</div>
                                <div className="text-[10px] text-purple-300/70 truncate">{secondary}</div>
                                {(city || country) && (
                                  <div className="text-[10px] text-pink-400/60 mt-0.5">
                                    {[city, country].filter(Boolean).join(", ")}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-purple-500/20" />
                <span className="text-[10px] text-purple-400/60 font-medium">or fill in manually</span>
                <div className="flex-1 h-px bg-purple-500/20" />
              </div>

              {/* Location name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-purple-200">Location Name *</Label>
                <Input
                  value={form.location_name}
                  onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                  placeholder="e.g. Goa Beach Trip"
                  className="bg-white/5 border-purple-500/30 text-white placeholder:text-white/30 focus-visible:ring-pink-500/50"
                  required
                />
              </div>

              {/* City + Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-purple-200">City</Label>
                  <Input
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Goa"
                    className="bg-white/5 border-purple-500/30 text-white placeholder:text-white/30 focus-visible:ring-pink-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-purple-200">Country</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 pointer-events-none" />
                    <Input
                      value={form.country}
                      onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                      placeholder="India"
                      className="pl-9 bg-white/5 border-purple-500/30 text-white placeholder:text-white/30 focus-visible:ring-pink-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Lat + Lng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-purple-200">Latitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    placeholder="15.2993"
                    className="bg-white/5 border-purple-500/30 text-white placeholder:text-white/30 focus-visible:ring-pink-500/50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-purple-200">Longitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    placeholder="74.1240"
                    className="bg-white/5 border-purple-500/30 text-white placeholder:text-white/30 focus-visible:ring-pink-500/50"
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-purple-400/70">💡 Click anywhere on the map or search above to auto-fill coordinates</p>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-purple-200">Date Visited</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={form.date_visited}
                    onChange={e => setForm(f => ({ ...f, date_visited: e.target.value }))}
                    className="pl-9 bg-white/5 border-purple-500/30 text-white focus-visible:ring-pink-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-purple-200">Memory Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe this beautiful memory…"
                  rows={3}
                  className="bg-white/5 border-purple-500/30 text-white placeholder:text-white/30 focus-visible:ring-pink-500/50 resize-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-purple-200 flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Tags
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                        selectedTags.includes(tag)
                          ? "bg-pink-500/30 border-pink-400/60 text-pink-200"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/70"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-purple-200 flex items-center gap-1.5">
                  <Image className="h-3 w-3" /> Photos
                </Label>
                <label className="flex flex-col items-center justify-center gap-1.5 h-20 border border-dashed border-purple-500/30 rounded-xl bg-white/3 hover:bg-white/5 cursor-pointer transition-colors">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files)} />
                  {uploading ? (
                    <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  ) : (
                    <>
                      <Image className="h-4 w-4 text-purple-400" />
                      <span className="text-[11px] text-purple-300">Click to upload photos</span>
                    </>
                  )}
                </label>
                {uploadedUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {uploadedUrls.map((url, i) => (
                      <div key={i} className="h-12 w-12 rounded-lg overflow-hidden border border-purple-500/30">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                    <span className="text-[11px] text-purple-400 self-center">{uploadedUrls.length} photo{uploadedUrls.length !== 1 ? "s" : ""} added</span>
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-purple-500/20 bg-black/20 flex gap-3">
              <Button type="button" onClick={handleClose} variant="ghost" className="flex-1 text-purple-300 hover:text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={addLocation.isPending}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white border-0 font-semibold"
              >
                {addLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                Pin Location
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
