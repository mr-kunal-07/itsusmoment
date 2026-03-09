import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TravelLocation } from "@/hooks/useTravelLocations";

interface Props {
  locations: TravelLocation[];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (location: TravelLocation) => void;
  focusLocation: TravelLocation | null;
}

function makePin(visited: boolean) {
  const color = visited ? "#22c55e" : "#ec4899";
  const emoji = visited ? "✓" : "♥";
  return `
    <div style="
      width:36px;height:42px;
      display:flex;flex-direction:column;align-items:center;
      filter:drop-shadow(0 3px 8px ${color}88);
    ">
      <div style="
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        display:flex;align-items:center;justify-content:center;
        border:2.5px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.18);
      ">
        <span style="transform:rotate(45deg);font-size:13px;color:white;font-weight:700;">${emoji}</span>
      </div>
    </div>
  `;
}

function makeSelectedPin(visited: boolean) {
  const color = visited ? "#16a34a" : "#db2777";
  const emoji = visited ? "✓" : "♥";
  return `
    <div style="
      width:44px;height:52px;
      display:flex;flex-direction:column;align-items:center;
      filter:drop-shadow(0 4px 16px ${color}cc);
    ">
      <div style="
        width:40px;height:40px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        display:flex;align-items:center;justify-content:center;
        border:3px solid white;
        box-shadow:0 4px 16px rgba(0,0,0,0.25);
      ">
        <span style="transform:rotate(45deg);font-size:16px;color:white;font-weight:700;">${emoji}</span>
      </div>
    </div>
  `;
}

export function TravelMapCanvas({ locations, onMapClick, onPinClick, focusLocation }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onPinClickRef = useRef(onPinClick);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onPinClickRef.current = onPinClick; }, [onPinClick]);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      doubleClickZoom: true,
    });

    // Clean OSM/CartoDB Voyager tiles — no satellite
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.fitBounds([[-75, -180], [85, 180]], { padding: [0, 0] });
    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync markers when locations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!locations.find(l => l.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    locations.forEach(loc => {
      const existing = markersRef.current.get(loc.id);
      if (existing) {
        // Update icon in case visited changed
        existing.setIcon(L.divIcon({
          html: makePin(loc.visited ?? false),
          className: "",
          iconSize: [36, 42],
          iconAnchor: [18, 42],
        }));
        return;
      }

      const icon = L.divIcon({
        html: makePin(loc.visited ?? false),
        className: "",
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -44],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon })
        .addTo(map)
        .on("click", () => onPinClickRef.current(loc));

      marker.bindTooltip(
        `<div style="background:white;border:1.5px solid #e2e8f0;color:#1e293b;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
          ${loc.visited ? "✅" : "📍"} ${loc.location_name}${loc.city ? `<br><span style="font-weight:400;font-size:10px;color:#64748b">${loc.city}${loc.country ? `, ${loc.country}` : ""}</span>` : ""}
        </div>`,
        { permanent: false, direction: "top", offset: [0, -8], opacity: 1 }
      );

      markersRef.current.set(loc.id, marker);
    });

    // Journey polyline (only visited locations, sorted by date)
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const visited = locations
      .filter(l => l.visited && l.date_visited)
      .sort((a, b) => (a.date_visited ?? "").localeCompare(b.date_visited ?? ""));

    if (visited.length >= 2) {
      const points = visited.map(l => [l.latitude, l.longitude] as [number, number]);
      polylineRef.current = L.polyline(points, {
        color: "#22c55e",
        weight: 2.5,
        opacity: 0.6,
        dashArray: "7 9",
        lineCap: "round",
      }).addTo(map);
    }
  }, [locations]);

  // Focus / fly-to when a pin is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusLocation) return;
    map.flyTo([focusLocation.latitude, focusLocation.longitude], 13, { duration: 1.0 });

    // Swap to selected (larger) icon
    const marker = markersRef.current.get(focusLocation.id);
    if (marker) {
      marker.setIcon(L.divIcon({
        html: makeSelectedPin(focusLocation.visited ?? false),
        className: "",
        iconSize: [44, 52],
        iconAnchor: [22, 52],
      }));
    }

    return () => {
      // Restore normal icon when focus cleared
      if (marker) {
        marker.setIcon(L.divIcon({
          html: makePin(focusLocation.visited ?? false),
          className: "",
          iconSize: [36, 42],
          iconAnchor: [18, 42],
        }));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusLocation]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: "300px", cursor: "crosshair" }}
    />
  );
}
