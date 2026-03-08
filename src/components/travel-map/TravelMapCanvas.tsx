import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TravelLocation } from "@/hooks/useTravelLocations";

interface Props {
  locations: TravelLocation[];
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (location: TravelLocation) => void;
  focusLocation: TravelLocation | null;
  showHeatmap?: boolean;
}

// Heart-shaped SVG pin
function HeartPin(color = "#ec4899") {
  return `
    <div style="
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 4px 12px ${color}88);
      animation:heartBounce 0.5s cubic-bezier(.36,.07,.19,.97) 1;
    ">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
      </svg>
    </div>
  `;
}

function GlowHeartPin() {
  return `
    <div style="
      width:44px;height:44px;
      display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 0 12px #f472b6) drop-shadow(0 0 24px #a855f7);
    ">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="#f472b6" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
      </svg>
    </div>
  `;
}

// Normalize country name for matching GeoJSON
function normalizeCountry(name: string): string {
  return name.trim().toLowerCase()
    .replace(/\bunited states\b.*/i, "united states of america")
    .replace(/\busa\b/i, "united states of america")
    .replace(/\buk\b/i, "united kingdom")
    .replace(/\bsouth korea\b/i, "republic of korea")
    .replace(/\bnorth korea\b/i, "democratic people's republic of korea");
}

export function TravelMapCanvas({ locations, onMapClick, onPinClick, focusLocation, showHeatmap = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const geojsonDataRef = useRef<GeoJSON.FeatureCollection | null>(null);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers + polyline
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

    // Show/hide existing markers based on heatmap mode
    markersRef.current.forEach(marker => {
      if (showHeatmap) {
        marker.setOpacity(0);
      } else {
        marker.setOpacity(1);
      }
    });

    if (!showHeatmap) {
      // Add new markers
      locations.forEach(loc => {
        if (markersRef.current.has(loc.id)) return;

        const icon = L.divIcon({
          html: HeartPin(),
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const hoverIcon = L.divIcon({
          html: GlowHeartPin(),
          className: "",
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .on("click", () => onPinClick(loc))
          .on("mouseover", function () { (this as L.Marker).setIcon(hoverIcon); })
          .on("mouseout", function () { (this as L.Marker).setIcon(icon); });

        marker.bindTooltip(
          `<div style="background:#1e0b3a;border:1px solid #9333ea44;color:#e9d5ff;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 4px 20px #0006;backdrop-filter:blur(8px)">
            ❤️ ${loc.location_name}${loc.city ? `<br><span style="font-weight:400;font-size:10px;color:#c084fc">📍 ${loc.city}</span>` : ""}
          </div>`,
          { permanent: false, direction: "top", offset: [0, -8], opacity: 1 }
        );

        markersRef.current.set(loc.id, marker);
      });
    }

    // Travel path polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!showHeatmap) {
      const sorted = [...locations]
        .filter(l => l.date_visited)
        .sort((a, b) => (a.date_visited ?? "").localeCompare(b.date_visited ?? ""));

      if (sorted.length >= 2) {
        const points = sorted.map(l => [l.latitude, l.longitude] as [number, number]);
        polylineRef.current = L.polyline(points, {
          color: "#f472b6",
          weight: 2,
          opacity: 0.5,
          dashArray: "6 8",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }
    }
  }, [locations, onPinClick, showHeatmap]);

  // Heatmap: GeoJSON country layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing geojson layer
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
      geojsonLayerRef.current = null;
    }

    if (!showHeatmap) return;

    const visitedCountries = new Set(
      locations
        .map(l => l.country)
        .filter(Boolean)
        .map(c => normalizeCountry(c!))
    );

    const renderGeoJSON = (data: GeoJSON.FeatureCollection) => {
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.remove();
      }

      const layer = L.geoJSON(data, {
        style: (feature) => {
          const name = normalizeCountry(
            feature?.properties?.ADMIN ||
            feature?.properties?.name ||
            feature?.properties?.NAME ||
            ""
          );
          const visited = visitedCountries.has(name);
          return {
            fillColor: visited ? "#ec4899" : "transparent",
            fillOpacity: visited ? 0.35 : 0,
            color: visited ? "#f472b6" : "#ffffff08",
            weight: visited ? 1.5 : 0.5,
            opacity: visited ? 0.8 : 0.15,
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.ADMIN || feature?.properties?.name || "";
          const normName = normalizeCountry(name);
          const isVisited = visitedCountries.has(normName);

          if (isVisited) {
            const count = locations.filter(l => l.country && normalizeCountry(l.country) === normName).length;
            layer.bindTooltip(
              `<div style="background:#1e0b3a;border:1px solid #ec489944;color:#fce7f3;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 4px 20px #0006">
                ❤️ ${name}<br><span style="font-size:10px;color:#f9a8d4;font-weight:400">${count} memor${count === 1 ? "y" : "ies"}</span>
              </div>`,
              { sticky: true, opacity: 1 }
            );
            layer.on("mouseover", function (e: L.LeafletMouseEvent) {
              (e.target as L.Path).setStyle({ fillOpacity: 0.55, weight: 2 });
            });
            layer.on("mouseout", function (e: L.LeafletMouseEvent) {
              (e.target as L.Path).setStyle({ fillOpacity: 0.35, weight: 1.5 });
            });
          }
        },
      });

      layer.addTo(map);
      geojsonLayerRef.current = layer;
    };

    // Use cached data if available
    if (geojsonDataRef.current) {
      renderGeoJSON(geojsonDataRef.current);
      return;
    }

    // Fetch world countries GeoJSON (free, open data)
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then(r => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        geojsonDataRef.current = data;
        renderGeoJSON(data);
      })
      .catch(() => {
        // silently fail — heatmap just won't render
      });
  }, [locations, showHeatmap]);

  // Focus on selected location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusLocation) return;
    map.flyTo([focusLocation.latitude, focusLocation.longitude], 8, {
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [focusLocation]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: "70vh", cursor: showHeatmap ? "default" : "crosshair" }}
    />
  );
}
