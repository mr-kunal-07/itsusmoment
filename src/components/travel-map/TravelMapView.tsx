import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Map, List, Share2, Download, Loader2, Heart, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTravelLocations, TravelLocation } from "@/hooks/useTravelLocations";
import { useMedia } from "@/hooks/useMedia";
import { useMyCouple } from "@/hooks/useCouple";
import { useAllProfiles, useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { TravelMapCanvas } from "./TravelMapCanvas";
import { AddLocationModal } from "./AddLocationModal";
import { LocationPopup } from "./LocationPopup";
import { TravelStats } from "./TravelStats";
import { TimelineView } from "./TimelineView";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ViewMode = "map" | "heatmap" | "timeline";

// Floating heart particles
function FloatingHearts() {
  const hearts = Array.from({ length: 8 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-pink-400/20 select-none"
          style={{ left: `${10 + i * 11}%`, fontSize: `${12 + (i % 3) * 8}px` }}
          animate={{ y: ["100%", "-20%"], opacity: [0, 0.6, 0], x: [0, (i % 2 === 0 ? 15 : -15)] }}
          transition={{ duration: 5 + i * 0.7, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

// Countries visited legend for heatmap
function HeatmapLegend({ locations }: { locations: TravelLocation[] }) {
  const countMap: Record<string, number> = {};
  locations.forEach(l => {
    if (l.country) countMap[l.country] = (countMap[l.country] ?? 0) + 1;
  });
  const countries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);

  if (countries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-3 right-3 z-10 bg-black/60 border border-purple-500/20 rounded-xl p-3 backdrop-blur-md max-w-[180px]"
    >
      <div className="text-[10px] font-bold text-pink-300 mb-2 flex items-center gap-1">
        <Globe className="h-3 w-3" /> Countries Visited
      </div>
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {countries.map(([country, count]) => (
          <div key={country} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-pink-500 shrink-0" />
              <span className="text-[10px] text-white/80 truncate">{country}</span>
            </div>
            <span className="text-[10px] text-pink-300 font-medium shrink-0">{count}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-purple-500/20">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-8 rounded-full bg-gradient-to-r from-pink-500/30 to-pink-500" />
          <span className="text-[9px] text-purple-300">= visited</span>
        </div>
      </div>
    </motion.div>
  );
}

const VIEW_TABS: { id: ViewMode; label: string; icon: typeof Map }[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "heatmap", label: "Heatmap", icon: Globe },
  { id: "timeline", label: "Timeline", icon: List },
];

export function TravelMapView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: couple } = useMyCouple();
  const { data: locations = [], isLoading } = useTravelLocations();
  const { data: allMedia = [] } = useMedia();
  const { data: profile } = useProfile();
  const { data: profiles = [] } = useAllProfiles();
  const exportRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<ViewMode>("map");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [focusLocation, setFocusLocation] = useState<TravelLocation | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) : null;
  const coupleName = [
    profile?.display_name ?? "You",
    partnerProfile?.display_name ?? "Partner",
  ].join(" ❤️ ");

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (mode === "heatmap") return; // disable click-to-add in heatmap mode
    setClickedCoords({ lat, lng });
    setAddOpen(true);
  }, [mode]);

  const handleTimelineSelect = (loc: TravelLocation) => {
    setFocusLocation(loc);
    setSelectedLocation(loc);
    setMode("map");
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "our-travel-map.png";
      a.click();
      toast({ title: "📸 Travel map downloaded!" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "our-travel-map.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${coupleName} — Travel Map` });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "our-travel-map.png";
        a.click();
        toast({ title: "Image saved — open Instagram and upload from your gallery!" });
      }
    } catch {
      // user cancelled
    } finally {
      setExporting(false);
    }
  };

  if (!couple || couple.status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-5xl mb-4">🗺️</div>
        <h3 className="text-xl font-bold text-foreground mb-2">Link with a Partner First</h3>
        <p className="text-sm text-muted-foreground">The Travel Map is a couples feature. Connect with your partner to start pinning memories.</p>
      </div>
    );
  }

  const isMapView = mode === "map" || mode === "heatmap";

  return (
    <div className="relative min-h-screen bg-[#06030f] overflow-hidden">
      <FloatingHearts />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 pt-4 pb-2"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-rose-300 bg-clip-text text-transparent">
                Our Travel Map
              </span>
            </h1>
            <p className="text-[11px] text-purple-300 mt-0.5">{coupleName} · Journey Together</p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/5 border border-white/10">
              {VIEW_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    mode === tab.id
                      ? "bg-gradient-to-r from-pink-500/30 to-purple-600/30 text-white border border-pink-400/30"
                      : "text-white/50 hover:text-white/80"
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Export */}
            <Button size="sm" variant="ghost" onClick={handleExport} disabled={exporting}
              className="h-8 px-2 text-purple-300 hover:text-white hover:bg-white/10 border border-white/10">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleShare} disabled={exporting}
              className="h-8 px-2 text-pink-300 hover:text-white hover:bg-white/10 border border-white/10">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <TravelStats locations={locations} mediaCount={allMedia.length} />

      {/* Main content (exportable) */}
      <div ref={exportRef} className="relative">
        <AnimatePresence mode="wait">
          {isMapView ? (
            <motion.div
              key="map-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Heatmap banner */}
              {mode === "heatmap" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-3 mb-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/20 flex items-center gap-2"
                >
                  <Globe className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                  <p className="text-[11px] text-pink-200">
                    Countries you've visited together are highlighted in pink/purple
                    {locations.filter(l => l.country).length === 0 && " — add locations with a Country to see them highlighted"}
                  </p>
                </motion.div>
              )}

              {/* Map container */}
              <div
                className="relative mx-3 mb-4 rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl"
                style={{
                  height: "70vh",
                  background: "linear-gradient(135deg, #0a0520 0%, #130730 100%)",
                  boxShadow: "0 0 60px hsl(280,60%,20%,0.4), 0 0 120px hsl(280,60%,20%,0.2)",
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
                  </div>
                ) : (
                  <TravelMapCanvas
                    locations={locations}
                    onMapClick={handleMapClick}
                    onPinClick={loc => { if (mode !== "heatmap") setSelectedLocation(loc); }}
                    focusLocation={focusLocation}
                    showHeatmap={mode === "heatmap"}
                  />
                )}

                {/* Heatmap legend */}
                {mode === "heatmap" && !isLoading && <HeatmapLegend locations={locations} />}

                {/* Couple name watermark */}
                <div className="absolute bottom-3 left-3 pointer-events-none z-10">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-pink-500/20 backdrop-blur-md">
                    <Heart className="h-3 w-3 text-pink-400 fill-pink-400" />
                    <span className="text-[10px] font-semibold text-white/80">{coupleName}</span>
                  </div>
                </div>

                {/* Empty state */}
                {locations.length === 0 && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-4xl mb-3"
                    >
                      📍
                    </motion.div>
                    <p className="text-sm font-medium text-white/70">Click the map to pin your first memory</p>
                    <p className="text-xs text-purple-400 mt-1">Or use the ➕ button below</p>
                  </div>
                )}
              </div>

              {/* Floating Add button — hidden in heatmap mode */}
              {mode === "map" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setClickedCoords(null); setAddOpen(true); }}
                  className="fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-20 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-shadow"
                >
                  <Plus className="h-4 w-4" />
                  Add Memory
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[70vh]"
            >
              <TimelineView locations={locations} onSelectLocation={handleTimelineSelect} />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setClickedCoords(null); setAddOpen(true); }}
                className="fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-20 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/30"
              >
                <Plus className="h-4 w-4" />
                Add Memory
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AddLocationModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setClickedCoords(null); }}
        initialLat={clickedCoords?.lat}
        initialLng={clickedCoords?.lng}
      />

      {selectedLocation && (
        <LocationPopup
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
