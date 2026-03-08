import { motion } from "framer-motion";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import { TravelLocation } from "@/hooks/useTravelLocations";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  locations: TravelLocation[];
  onSelectLocation: (loc: TravelLocation) => void;
}

function groupByYear(locations: TravelLocation[]) {
  const groups: Record<string, TravelLocation[]> = {};
  const sorted = [...locations].sort((a, b) => {
    if (!a.date_visited && !b.date_visited) return 0;
    if (!a.date_visited) return 1;
    if (!b.date_visited) return -1;
    return b.date_visited.localeCompare(a.date_visited);
  });
  for (const loc of sorted) {
    const year = loc.date_visited ? loc.date_visited.slice(0, 4) : "Unknown";
    if (!groups[year]) groups[year] = [];
    groups[year].push(loc);
  }
  return groups;
}

const TRIP_EMOJIS: Record<string, string> = {
  "Trip": "✈️", "Anniversary": "💍", "Vacation": "🏖️",
  "Date Night": "🌹", "Road Trip": "🚗", "Adventure": "🏔️", "Honeymoon": "💑",
};

function getTripEmoji(tags: string[]) {
  for (const tag of tags) {
    if (TRIP_EMOJIS[tag]) return TRIP_EMOJIS[tag];
  }
  return "❤️";
}

export function TimelineView({ locations, onSelectLocation }: Props) {
  const grouped = groupByYear(locations);
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-5xl mb-4">🗺️</div>
        <h3 className="text-lg font-bold text-white mb-2">No trips pinned yet</h3>
        <p className="text-sm text-purple-300">Add your first travel memory to start your journey</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
      {years.map((year, yi) => (
        <motion.div
          key={year}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: yi * 0.1 }}
        >
          {/* Year badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-600/30 border border-pink-400/30 text-sm font-bold text-pink-200">
              {year}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
          </div>

          {/* Trip cards */}
          <div className="space-y-3 pl-2 border-l border-purple-500/20">
            {grouped[year].map((loc, li) => (
              <motion.button
                key={loc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: yi * 0.1 + li * 0.05 }}
                onClick={() => onSelectLocation(loc)}
                className="w-full text-left relative pl-5"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-pink-500 border-2 border-pink-300 shadow-[0_0_8px_hsl(330,80%,60%,0.5)]" />

                <div className={cn(
                  "rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-pink-900/20 p-3 hover:border-pink-400/40 hover:from-purple-900/40 transition-all group",
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 mt-0.5">{getTripEmoji(loc.tags ?? [])}</span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-pink-200 transition-colors">
                          {loc.location_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {(loc.city || loc.country) && (
                            <span className="flex items-center gap-1 text-[10px] text-purple-300">
                              <MapPin className="h-2.5 w-2.5" />
                              {[loc.city, loc.country].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {loc.date_visited && (
                            <span className="flex items-center gap-1 text-[10px] text-pink-300">
                              <Calendar className="h-2.5 w-2.5" />
                              {format(parseISO(loc.date_visited), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        {loc.description && (
                          <p className="text-[10px] text-white/50 mt-1 italic line-clamp-2">"{loc.description}"</p>
                        )}
                        {loc.tags && loc.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {loc.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-[9px] text-pink-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {loc.photo_urls && loc.photo_urls.length > 0 ? (
                      <div className="shrink-0 h-12 w-12 rounded-lg overflow-hidden border border-purple-500/30">
                        <img src={loc.photo_urls[0]} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-purple-400 shrink-0 mt-1 group-hover:text-pink-300 transition-colors" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
