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

// Subtle floating hearts — only on desktop
function FloatingHearts() {
  const hearts = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
      {hearts.map((_, i) => (
        <motion.div
          key={i}
          className="absolute select-none opacity-10"
          style={{ left: `${8 + i * 14}%`, fontSize: `${10 + (i % 3) * 6}px` }}
          animate={{ y: ["100%", "-10%"], opacity: [0, 0.15, 0] }}
          transition={{ duration: 6 + i * 0.8, repeat: Infinity, delay: i * 1.1, ease: "easeOut" }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

// Heatmap legend — themed to app
function HeatmapLegend({ locations }: { locations: TravelLocation[] }) {
  const countMap: Record<string, number> = {};
  locations.forEach(l => {
    if (l.country) countMap[l.country] = (countMap[l.country] ?? 0) + 1;
  });
  const countries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
  if (countries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-3 right-3 z-10 bg-card/90 border border-border rounded-xl p-3 backdrop-blur-md max-w-[160px] shadow-card"
    >
      <div className="text-[10px] font-bold text-foreground mb-2 flex items-center gap-1">
        <Globe2 className="h-3 w-3 text-pink-500" /> Countries
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {countries.map(([country, count]) => (
          <div key={country} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-pink-500 shrink-0" />
              <span className="text-[10px] text-foreground/80 truncate">{country}</span>
            </div>
            <span className="text-[10px] text-pink-500 font-semibold shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const VIEW_TABS: { id: ViewMode; label: string; icon: typeof Map }[] = [
  { id: "map",      label: "Map",      icon: Map   },
  { id: "heatmap",  label: "Heatmap",  icon: Globe2 },
  { id: "timeline", label: "Timeline", icon: List  },
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
    if (mode === "heatmap") return;
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
        toast({ title: "Image saved — upload from your gallery!" });
      }
    } catch { /* cancelled */ } finally {
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
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FloatingHearts />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-3 sm:px-4 pt-3 pb-1"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2 leading-tight">
              <span className="text-xl shrink-0">🗺️</span>
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 bg-clip-text text-transparent truncate">
                Our Travel Map
              </span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{coupleName} · Journey Together</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-secondary border border-border">
              {VIEW_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all",
                    mode === tab.id
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-3 w-3 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <Button
              size="sm" variant="outline" onClick={handleExport} disabled={exporting}
              className="h-7 w-7 p-0 rounded-lg"
            >
              {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            </Button>
            <Button
              size="sm" variant="outline" onClick={handleShare} disabled={exporting}
              className="h-7 w-7 p-0 rounded-lg"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Stats — always one row ── */}
      <TravelStats locations={locations} mediaCount={allMedia.length} />

      {/* ── Main content ── */}
      <div ref={exportRef} className="relative px-2 sm:px-3 pb-4">
        <AnimatePresence mode="wait">
          {isMapView ? (
            <motion.div
              key="map-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Heatmap info strip */}
              {mode === "heatmap" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2 px-3 py-1.5 rounded-xl bg-card border border-border flex items-center gap-2"
                >
                  <Globe2 className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    Visited countries are highlighted in pink
                    {locations.filter(l => l.country).length === 0 && " — add a country to see it highlighted"}
                  </p>
                </motion.div>
              )}

              {/* Map */}
              <div
                className="relative rounded-2xl overflow-hidden border border-border shadow-card"
                style={{ height: "clamp(320px, 68vh, 800px)" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full bg-card">
                    <Loader2 className="h-7 w-7 text-pink-500 animate-spin" />
                  </div>
                ) : (
                  <TravelMapCanvas
                    locations={locations}
                    onMapClick={handleMapClick}
                    onPinClick={loc => {
                      if (mode !== "heatmap") {
                        setSelectedLocation(loc);
                        setFocusLocation(loc);
                      }
                    }}
                    focusLocation={focusLocation}
                    showHeatmap={mode === "heatmap"}
                  />
                )}

                {/* Heatmap legend */}
                {mode === "heatmap" && !isLoading && <HeatmapLegend locations={locations} />}

                {/* Couple name watermark */}
                <div className="absolute bottom-3 left-3 pointer-events-none z-10">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/80 border border-border backdrop-blur-md">
                    <Heart className="h-2.5 w-2.5 text-pink-500 fill-pink-500" />
                    <span className="text-[10px] font-semibold text-foreground/80">{coupleName}</span>
                  </div>
                </div>

                {/* Empty state */}
                {locations.length === 0 && !isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <motion.div
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 2.2 }}
                      className="text-4xl mb-2"
                    >
                      📍
                    </motion.div>
                    <p className="text-sm font-medium text-foreground/70">Tap the map to pin your first memory</p>
                  </div>
                )}
              </div>

              {/* FAB — Add Memory */}
              {mode === "map" && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setClickedCoords(null); setAddOpen(true); }}
                  className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-20 flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Add Memory</span>
                  <span className="xs:hidden">Add</span>
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="min-h-[60vh]"
            >
              <TimelineView locations={locations} onSelectLocation={handleTimelineSelect} />

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setClickedCoords(null); setAddOpen(true); }}
                className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-20 flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/30"
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
          onClose={() => { setSelectedLocation(null); setFocusLocation(null); }}
        />
      )}
    </div>
  );
}
