import { useEffect, useRef, useState, memo, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { TravelLocation } from "@/hooks/useTravelLocations";

// ─── CountUp ──────────────────────────────────────────────────────────────────

interface CountUpProps {
  target: number;
  duration?: number;
}

const CountUp = memo(function CountUp({ target, duration = 1000 }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  useEffect(() => {
    if (!inView) return;
    if (target === 0) { setCount(0); return; }

    let frame: number;
    const start = performance.now();
    const startVal = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  locations: TravelLocation[];
  mediaCount: number;
}

interface StatItem {
  emoji: string;
  value: number;
  label: string;
}

// ─── TravelStats ──────────────────────────────────────────────────────────────

export const TravelStats = memo(function TravelStats({ locations, mediaCount }: Props) {
  const stats = useMemo<StatItem[]>(() => {
    const countries = new Set(locations.map(l => l.country).filter(Boolean)).size;
    const trips = new Set(locations.map(l => l.date_visited?.slice(0, 7)).filter(Boolean)).size;

    return [
      { emoji: "🌍", value: locations.length, label: "Places" },
      { emoji: "✈️", value: trips, label: "Trips" },
      { emoji: "🗺️", value: countries, label: "Countries" },
      { emoji: "❤️", value: mediaCount, label: "Memories" },
    ];
  }, [locations, mediaCount]);

  return (
    <div
      className="grid grid-cols-4 gap-1.5 px-2"
      role="group"
      aria-label="Travel statistics"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="relative rounded-xl border border-border/60 bg-background/85 backdrop-blur-md text-center py-2 px-1 shadow-sm"
        >
          <div className="text-sm leading-none mb-0.5" aria-hidden>{stat.emoji}</div>
          <div
            className="text-sm sm:text-base font-black text-foreground leading-none tabular-nums"
            aria-label={`${stat.value} ${stat.label}`}
          >
            <CountUp target={stat.value} />
          </div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground font-medium mt-0.5 truncate px-0.5">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
});

export default TravelStats;