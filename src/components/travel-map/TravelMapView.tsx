import { useState, useCallback, useRef, memo } from "react";
import { Plus, Loader2, Map, List, LocateFixed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTravelLocations, TravelLocation } from "@/hooks/useTravelLocations";
import { useMyCouple } from "@/hooks/useCouple";
import { useMedia } from "@/hooks/useMedia";
import { TravelMapCanvas, ReverseGeoResult } from "./TravelMapCanvas";
import { AddLocationModal } from "./AddLocationModal";
import { LocationPopup } from "./LocationPopup";
import { TimelineView } from "./TimelineView";
import { TravelStats } from "./TravelStats";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "map" | "timeline";

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptyOverlay = memo(function EmptyOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        className="text-4xl mb-2"
        aria-hidden
      >
        📍
      </motion.div>
      <p className="text-sm font-medium text-foreground/70 bg-background/85 backdrop-blur-sm px-4 py-2 rounded-full border border-border/40 shadow-sm">
        Tap anywhere on the map to pin a memory
      </p>
    </div>
  );
});

const NoCoupleState = memo(function NoCoupleState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6 gap-3">
      <span className="text-5xl" aria-hidden>🗺️</span>
      <h3 className="text-xl font-bold text-foreground">Link with a Partner First</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Travel Map is a couples feature. Connect with your partner to start pinning shared memories.
      </p>
    </div>
  );
});

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "timeline", label: "Timeline", icon: List },
];

const TabBar = memo(function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/80 backdrop-blur-sm border border-border/40 shadow-sm" role="tablist" aria-label="Travel view">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
            active === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
});

// ─── GPS indicator pill ───────────────────────────────────────────────────────

const LocatingPill = memo(function LocatingPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/90 text-white text-xs font-semibold shadow-md backdrop-blur-sm"
    >
      <LocateFixed className="h-3 w-3 animate-pulse" aria-hidden />
      Finding your location…
    </motion.div>
  );
});

// ─── TravelMapView ────────────────────────────────────────────────────────────

export function TravelMapView() {
  const { data: couple } = useMyCouple();
  const { data: locations = [], isLoading } = useTravelLocations();
  const { data: allMedia = [] } = useMedia();

  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [focusLocation, setFocusLocation] = useState<TravelLocation | null>(null);
  const [locating, setLocating] = useState(false);

  // Store the latest coords + geo in a ref so the modal always sees current values
  // even if re-opened from a previous click while geocoding is still in flight
  const pendingCoordsRef = useRef<{ lat: number; lng: number; geo?: ReverseGeoResult } | null>(null);
  const [modalKey, setModalKey] = useState(0); // bump to force modal to re-read ref

  // ── Two-phase map click ────────────────────────────────────────────────────
  // Phase 1 (geo = undefined): coords arrive immediately → open modal
  // Phase 2 (geo defined):     reverse-geocode result → update modal fields
  const handleMapClick = useCallback((lat: number, lng: number, geo?: ReverseGeoResult) => {
    if (!geo) {
      // Phase 1: open modal immediately
      pendingCoordsRef.current = { lat, lng };
      setModalKey(k => k + 1);
      setAddOpen(true);
    } else {
      // Phase 2: enrich — bump key so AddLocationModal re-reads updated ref
      pendingCoordsRef.current = { lat, lng, geo };
      setModalKey(k => k + 1);
    }
  }, []);

  const handlePinClick = useCallback((loc: TravelLocation) => {
    setSelectedLocation(loc);
    setFocusLocation(loc);
  }, []);

  const handleAddClose = useCallback(() => {
    setAddOpen(false);
    pendingCoordsRef.current = null;
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedLocation(null);
    setFocusLocation(null);
  }, []);

  const handleOpenAdd = useCallback(() => {
    pendingCoordsRef.current = null;
    setModalKey(k => k + 1);
    setAddOpen(true);
  }, []);

  if (!couple || couple.status !== "active") return <NoCoupleState />;

  const mapHeight = "calc(100dvh - 52px - env(safe-area-inset-bottom, 0px))";
  const pending = pendingCoordsRef.current;

  return (
    <div
      className="relative flex flex-col bg-background overflow-hidden"
      style={{ height: mapHeight, isolation: "isolate" }}
    >
      {/* ── Floating top bar ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none w-full px-3 sm:px-0 sm:w-auto">
        <div className="pointer-events-auto w-full sm:w-auto">
          <TravelStats locations={locations} mediaCount={allMedia.length} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <TabBar active={activeTab} onChange={setActiveTab} />
          <AnimatePresence>{locating && <LocatingPill />}</AnimatePresence>
        </div>
      </div>

      {/* ── Map tab ── */}
      <AnimatePresence initial={false}>
        {activeTab === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ zIndex: 0 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-muted/30">
                <Loader2 className="h-7 w-7 text-primary animate-spin" aria-label="Loading map" />
              </div>
            ) : (
              <TravelMapCanvas
                locations={locations}
                onMapClick={handleMapClick}
                onPinClick={handlePinClick}
                focusLocation={focusLocation}
                onLocating={setLocating}
              />
            )}
            {!isLoading && locations.length === 0 && <EmptyOverlay />}
          </motion.div>
        )}

        {/* ── Timeline tab ── */}
        {activeTab === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 overflow-y-auto pt-28 pb-24 sm:pb-6"
            style={{ zIndex: 1 }}
          >
            <TimelineView
              locations={locations}
              onSelectLocation={(loc) => {
                handlePinClick(loc);
                setActiveTab("map");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AddLocationModal
        key={modalKey}
        open={addOpen}
        onClose={handleAddClose}
        initialLat={pending?.lat}
        initialLng={pending?.lng}
        initialGeo={pending?.geo}
      />

      <LocationPopup location={selectedLocation} onClose={handlePopupClose} />
    </div>
  );
}

export default TravelMapView;