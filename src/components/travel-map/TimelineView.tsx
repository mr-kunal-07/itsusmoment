import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import { TravelLocation } from "@/hooks/useTravelLocations";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIP_EMOJIS: Record<string, string> = {
  Trip: "✈️",
  Anniversary: "💍",
  Vacation: "🏖️",
  "Date Night": "🌹",
  "Road Trip": "🚗",
  Adventure: "🏔️",
  Honeymoon: "💑",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTripEmoji(tags: string[]): string {
  for (const tag of tags) {
    if (TRIP_EMOJIS[tag]) return TRIP_EMOJIS[tag];
  }
  return "❤️";
}

function groupByYear(locations: TravelLocation[]): Record<string, TravelLocation[]> {
  // Sort newest first; undated entries go to bottom
  const sorted = [...locations].sort((a, b) => {
    if (!a.date_visited && !b.date_visited) return 0;
    if (!a.date_visited) return 1;
    if (!b.date_visited) return -1;
    return b.date_visited.localeCompare(a.date_visited);
  });

  return sorted.reduce<Record<string, TravelLocation[]>>((acc, loc) => {
    const year = loc.date_visited?.slice(0, 4) ?? "Unknown";
    (acc[year] ??= []).push(loc);
    return acc;
  }, {});
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  locations: TravelLocation[];
  onSelectLocation: (loc: TravelLocation) => void;
}

// ─── TripCard ─────────────────────────────────────────────────────────────────

interface TripCardProps {
  loc: TravelLocation;
  yearIndex: number;
  cardIndex: number;
  onSelect: (loc: TravelLocation) => void;
}

const TripCard = memo(function TripCard({ loc, yearIndex, cardIndex, onSelect }: TripCardProps) {
  const emoji = getTripEmoji(loc.tags ?? []);

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: yearIndex * 0.1 + cardIndex * 0.05, duration: 0.3 }}
      onClick={() => onSelect(loc)}
      className="w-full text-left relative pl-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      aria-label={`View ${loc.location_name}`}
    >
      {/* Timeline dot */}
      <div
        aria-hidden
        className="absolute -left-[5px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-primary/30"
        style={{ boxShadow: "0 0 8px hsl(var(--primary)/0.5)" }}
      />

      <div className="rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-150 p-3 group">
        <div className="flex items-start justify-between gap-2">
          {/* Left: emoji + info */}
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden>{emoji}</span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {loc.location_name}
              </h4>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {(loc.city || loc.country) && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" aria-hidden />
                    {[loc.city, loc.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {loc.date_visited && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-2.5 w-2.5" aria-hidden />
                    {format(parseISO(loc.date_visited), "MMM d, yyyy")}
                  </span>
                )}
              </div>

              {loc.description && (
                <p className="text-[10px] text-muted-foreground/70 mt-1 italic line-clamp-2">
                  "{loc.description}"
                </p>
              )}

              {loc.tags && loc.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {loc.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] text-primary font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: thumbnail or chevron */}
          {loc.photo_urls && loc.photo_urls.length > 0 ? (
            <div className="shrink-0 h-12 w-12 rounded-lg overflow-hidden border border-border">
              <img
                src={loc.photo_urls[0]}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <ChevronRight
              className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors"
              aria-hidden
            />
          )}
        </div>
      </div>
    </motion.button>
  );
});

// ─── TimelineView ─────────────────────────────────────────────────────────────

export const TimelineView = memo(function TimelineView({ locations, onSelectLocation }: Props) {
  const grouped = useMemo(() => groupByYear(locations), [locations]);
  const years = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-3">
        <span className="text-5xl" aria-hidden>🗺️</span>
        <h3 className="text-lg font-bold text-foreground">No trips pinned yet</h3>
        <p className="text-sm text-muted-foreground">Add your first travel memory to start your journey</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
      {years.map((year, yi) => (
        <motion.section
          key={year}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: yi * 0.08, duration: 0.3 }}
          aria-label={`Trips in ${year}`}
        >
          {/* Year label */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
              {year}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" aria-hidden />
          </div>

          {/* Cards */}
          <div className="space-y-3 pl-2 border-l border-border/50">
            {grouped[year].map((loc, li) => (
              <TripCard
                key={loc.id}
                loc={loc}
                yearIndex={yi}
                cardIndex={li}
                onSelect={onSelectLocation}
              />
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  );
});

export default TimelineView;