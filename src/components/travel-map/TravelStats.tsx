import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TravelLocation } from "@/hooks/useTravelLocations";

interface Props {
  locations: TravelLocation[];
  mediaCount: number;
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || target === 0) { setCount(target); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export function TravelStats({ locations, mediaCount }: Props) {
  const countries = new Set(locations.map(l => l.country).filter(Boolean)).size;
  const uniqueDates = new Set(locations.map(l => l.date_visited?.slice(0, 7)).filter(Boolean)).size;

  const stats = [
    { emoji: "🌍", value: locations.length, label: "Places" },
    { emoji: "✈️", value: uniqueDates,       label: "Trips"  },
    { emoji: "🗺️", value: countries,         label: "Countries" },
    { emoji: "❤️", value: mediaCount,        label: "Memories" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-3 pb-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.35 }}
          className="relative overflow-hidden rounded-xl border border-border bg-card text-center py-2.5 px-1"
        >
          <div className="text-base leading-none mb-1">{stat.emoji}</div>
          <div className="text-base sm:text-lg font-black text-foreground leading-none">
            <CountUp target={stat.value} />
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-1 truncate px-1">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
