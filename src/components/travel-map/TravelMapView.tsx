import { useState, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTravelLocations, TravelLocation } from "@/hooks/useTravelLocations";
import { useMyCouple } from "@/hooks/useCouple";
import { TravelMapCanvas } from "./TravelMapCanvas";
import { AddLocationModal } from "./AddLocationModal";
import { LocationPopup } from "./LocationPopup";

export function TravelMapView() {
  const { data: couple } = useMyCouple();
  const { data: locations = [], isLoading } = useTravelLocations();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<TravelLocation | null>(null);
  const [focusLocation, setFocusLocation] = useState<TravelLocation | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setAddOpen(true);
  }, []);

  if (!couple || couple.status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-5xl mb-4">🗺️</div>
        <h3 className="text-xl font-bold text-foreground mb-2">Link with a Partner First</h3>
        <p className="text-sm text-muted-foreground">The Travel Map is a couples feature. Connect with your partner to start pinning memories.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-background" style={{ isolation: "isolate" }}>
      {/* Map — isolated stacking context prevents Leaflet tiles bleeding over sidebar */}
      <div
        className="relative flex-1 min-h-0"
        style={{ height: "calc(100dvh - 112px)", zIndex: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-muted/30">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
        ) : (
          <TravelMapCanvas
            locations={locations}
            onMapClick={handleMapClick}
            onPinClick={(loc) => {
              setSelectedLocation(loc);
              setFocusLocation(loc);
            }}
            focusLocation={focusLocation}
          />
        )}

        {/* Empty state overlay */}
        {locations.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="text-4xl mb-2"
            >
              📍
            </motion.div>
            <p className="text-sm font-medium text-foreground/70 bg-background/80 px-3 py-1.5 rounded-full">
              Tap the map to pin your first memory
            </p>
          </div>
        )}

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { setClickedCoords(null); setAddOpen(true); }}
          className="absolute bottom-5 right-5 z-20 flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg transition-shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Add Place</span>
        </motion.button>
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
