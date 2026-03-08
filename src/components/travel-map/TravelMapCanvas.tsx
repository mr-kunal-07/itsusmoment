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
      filter:drop-shadow(0 4px 14px ${color}99);
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
      width:48px;height:48px;
      display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 0 10px #f472b6) drop-shadow(0 0 22px #a855f7) drop-shadow(0 0 40px #ec489960);
      animation:heartBounce 0.3s ease 1;
    ">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#f472b6" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
      </svg>
    </div>
  `;
}

function normalizeCountry(name: string): string {
  return name.trim().toLowerCase()
    .replace(/\bunited states\b.*/i, "united states of america")
    .replace(/\busa\b/i, "united states of america")
    .replace(/\buk\b/i, "united kingdom")
    .replace(/\bsouth korea\b/i, "republic of korea")
    .replace(/\bnorth korea\b/i, "democratic people's republic of korea");
}

const GEOFENCE_STYLE: L.PathOptions = {
  color: "#f472b6",
  weight: 3,
  opacity: 1,
  dashArray: "0",
  lineCap: "round",
  lineJoin: "round",
  fillColor: "#fce7f3",
  fillOpacity: 0.30,
};

const GEOFENCE_HOVER: L.PathOptions = {
  fillOpacity: 0.50,
  weight: 4.5,
};

export function TravelMapCanvas({ locations, onMapClick, onPinClick, focusLocation, showHeatmap = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const geojsonDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const geofenceLayerRef = useRef<L.GeoJSON | null>(null);

  // ── Init map once
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
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.fitBounds([[-75, -180], [85, 180]], { padding: [0, 0] });
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

  // ── Markers + polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      if (!locations.find(l => l.id === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    markersRef.current.forEach(marker => {
      marker.setOpacity(showHeatmap ? 0 : 1);
    });

    if (!showHeatmap) {
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
          iconSize: [48, 48],
          iconAnchor: [24, 48],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(map)
          .on("click", () => onPinClick(loc))
          .on("mouseover", function () { (this as L.Marker).setIcon(hoverIcon); })
          .on("mouseout", function () { (this as L.Marker).setIcon(icon); });

        marker.bindTooltip(
          `<div style="background:rgba(255,255,255,0.95);border:1.5px solid #f9a8d4;color:#831843;padding:6px 12px;border-radius:10px;font-size:12px;font-weight:700;box-shadow:0 4px 20px rgba(236,72,153,0.2)">
            ❤️ ${loc.location_name}${loc.city ? `<br><span style="font-weight:500;font-size:10px;color:#be185d">📍 ${loc.city}</span>` : ""}
          </div>`,
          { permanent: false, direction: "top", offset: [0, -8], opacity: 1 }
        );

        markersRef.current.set(loc.id, marker);
      });
    }

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
        L.polyline(points, { color: "#f9a8d4", weight: 6, opacity: 0.18, lineCap: "round" }).addTo(map);
        polylineRef.current = L.polyline(points, {
          color: "#ec4899",
          weight: 2.5,
          opacity: 0.75,
          dashArray: "7 9",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }
    }
  }, [locations, onPinClick, showHeatmap]);

  // ── Heatmap GeoJSON layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
      geojsonLayerRef.current = null;
    }

    if (!showHeatmap) return;

    const visitedCountries = new Set(
      locations.map(l => l.country).filter(Boolean).map(c => normalizeCountry(c!))
    );

    const renderGeoJSON = (data: GeoJSON.FeatureCollection) => {
      if (geojsonLayerRef.current) geojsonLayerRef.current.remove();

      const layer = L.geoJSON(data, {
        style: (feature) => {
          const name = normalizeCountry(
            feature?.properties?.ADMIN || feature?.properties?.name || feature?.properties?.NAME || ""
          );
          const visited = visitedCountries.has(name);
          return {
            fillColor: visited ? "#ec4899" : "transparent",
            fillOpacity: visited ? 0.4 : 0,
            color: visited ? "#f472b6" : "#00000008",
            weight: visited ? 2 : 0.3,
            opacity: visited ? 1 : 0.1,
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.ADMIN || feature?.properties?.name || "";
          const normName = normalizeCountry(name);
          if (visitedCountries.has(normName)) {
            const count = locations.filter(l => l.country && normalizeCountry(l.country) === normName).length;
            layer.bindTooltip(
              `<div style="background:rgba(255,255,255,0.96);border:1.5px solid #f9a8d4;color:#831843;padding:6px 10px;border-radius:10px;font-size:12px;font-weight:700;box-shadow:0 4px 20px rgba(236,72,153,0.25)">
                ❤️ ${name}<br><span style="font-size:10px;color:#be185d;font-weight:500">${count} memor${count === 1 ? "y" : "ies"}</span>
              </div>`,
              { sticky: true, opacity: 1 }
            );
            layer.on("mouseover", function (e: L.LeafletMouseEvent) {
              (e.target as L.Path).setStyle({ fillOpacity: 0.65, weight: 2.5 });
            });
            layer.on("mouseout", function (e: L.LeafletMouseEvent) {
              (e.target as L.Path).setStyle({ fillOpacity: 0.4, weight: 2 });
            });
          }
        },
      });

      layer.addTo(map);
      geojsonLayerRef.current = layer;
    };

    if (geojsonDataRef.current) {
      renderGeoJSON(geojsonDataRef.current);
      return;
    }

    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then(r => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        geojsonDataRef.current = data;
        renderGeoJSON(data);
      })
      .catch(() => {});
  }, [locations, showHeatmap]);

  // ── Geofence: real polygon boundary of selected location (NO circle fallback)
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (geofenceLayerRef.current) {
      geofenceLayerRef.current.remove();
      geofenceLayerRef.current = null;
    }

    if (!map || !focusLocation) return;

    const isPolygon = (type?: string) => type === "Polygon" || type === "MultiPolygon";

    const applyLayer = (geojson: GeoJSON.Feature | GeoJSON.FeatureCollection) => {
      if (!mapInstanceRef.current) return;
      if (geofenceLayerRef.current) geofenceLayerRef.current.remove();

      const layer = L.geoJSON(geojson, {
        style: () => ({ ...GEOFENCE_STYLE }),
        onEachFeature: (_f, fl) => {
          fl.on("mouseover", function (e: L.LeafletMouseEvent) {
            (e.target as L.Path).setStyle({ ...GEOFENCE_STYLE, ...GEOFENCE_HOVER });
          });
          fl.on("mouseout", function (e: L.LeafletMouseEvent) {
            (e.target as L.Path).setStyle({ ...GEOFENCE_STYLE });
          });
        },
      });

      layer.addTo(mapInstanceRef.current);
      geofenceLayerRef.current = layer;

      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [52, 52], maxZoom: 15 });
      }
    };

    const { latitude: lat, longitude: lng, location_name, city, country } = focusLocation;

    // Draw a bounding-box rectangle as fallback (styled same as geofence)
    const applyBboxRect = (bbox: [number, number, number, number]) => {
      if (!mapInstanceRef.current) return;
      if (geofenceLayerRef.current) geofenceLayerRef.current.remove();
      // bbox = [minLon, minLat, maxLon, maxLat]
      const bounds: L.LatLngBoundsExpression = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
      const rect = L.rectangle(bounds, { ...GEOFENCE_STYLE });
      rect.on("mouseover", function () { rect.setStyle({ ...GEOFENCE_STYLE, ...GEOFENCE_HOVER }); });
      rect.on("mouseout", function () { rect.setStyle({ ...GEOFENCE_STYLE }); });
      rect.addTo(mapInstanceRef.current);
      geofenceLayerRef.current = rect as unknown as L.GeoJSON;
      const lb = L.latLngBounds(bounds as L.LatLngBoundsLiteral);
      if (lb.isValid()) {
        mapInstanceRef.current.fitBounds(lb, { padding: [52, 52], maxZoom: 15 });
      }
    };

    const fetchBoundary = async () => {
      // ── Step 1: Search by name — tries to find the actual named place boundary
      const searchQueries = [
        location_name && city && country ? `${location_name}, ${city}, ${country}` : null,
        location_name && country        ? `${location_name}, ${country}` : null,
        city && country                 ? `${city}, ${country}` : null,
        city                            ? city : null,
        country                         ? country : null,
      ].filter(Boolean) as string[];

      let bestBbox: [number, number, number, number] | null = null;

      for (const q of searchQueries) {
        try {
          const url =
            `https://nominatim.openstreetmap.org/search` +
            `?q=${encodeURIComponent(q)}` +
            `&format=geojson&polygon_geojson=1&limit=5&accept-language=en`;

          const res = await fetch(url, {
            headers: { "User-Agent": "OurVault-App/1.0", "Accept": "application/json" },
          });
          if (!res.ok) continue;

          const fc = (await res.json()) as GeoJSON.FeatureCollection;

          // Prefer a real polygon boundary
          const match = fc.features?.find(f => isPolygon(f.geometry?.type));
          if (match && mapInstanceRef.current) {
            applyLayer(match);
            return;
          }

          // Save bbox from first result as fallback
          if (!bestBbox && fc.features?.[0]?.bbox) {
            const b = fc.features[0].bbox as number[];
            if (b.length >= 4) bestBbox = [b[0], b[1], b[2], b[3]];
          }
        } catch { /* try next query */ }
      }

      // ── Step 2: Reverse geocode with polygon_geojson — from suburb down to state
      for (const zoom of [14, 12, 10, 8, 6]) {
        try {
          const url =
            `https://nominatim.openstreetmap.org/reverse` +
            `?lat=${lat}&lon=${lng}` +
            `&format=geojson&polygon_geojson=1&zoom=${zoom}&accept-language=en`;

          const res = await fetch(url, {
            headers: { "User-Agent": "OurVault-App/1.0", "Accept": "application/json" },
          });
          if (!res.ok) continue;

          const feature = (await res.json()) as GeoJSON.Feature;
          if (isPolygon(feature?.geometry?.type) && mapInstanceRef.current) {
            applyLayer(feature);
            return;
          }
          // Save bbox if available
          if (!bestBbox && feature?.bbox) {
            const b = feature.bbox as number[];
            if (b.length >= 4) bestBbox = [b[0], b[1], b[2], b[3]];
          }
        } catch { /* try next zoom */ }
      }

      // ── Step 3: Use saved bounding box as a styled rectangle
      if (bestBbox && mapInstanceRef.current) {
        applyBboxRect(bestBbox);
        return;
      }

      // ── No data at all — just fly to pin
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
      }
    };

    fetchBoundary();
  }, [focusLocation]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: "70vh", cursor: showHeatmap ? "default" : "crosshair", isolation: "isolate" }}
    />
  );
}
