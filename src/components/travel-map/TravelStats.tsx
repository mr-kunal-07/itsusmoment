import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TravelLocation } from "@/hooks/useTravelLocations";

interface Props {
  locations: TravelLocation[];
  mediaCount: number;
}

function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
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
    { emoji: "🌍", value: locations.length, label: "Places Visited" },
    { emoji: "✈️", value: uniqueDates, label: "Trips Together" },
    { emoji: "🗺️", value: countries, label: "Countries" },
    { emoji: "❤️", value: mediaCount, label: "Memories" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-pink-900/20 p-3 text-center"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(280,50%,20%,0.2),transparent_70%)]" />
          <div className="relative">
            <div className="text-xl mb-1">{stat.emoji}</div>
            <div className="text-xl sm:text-2xl font-black text-white">
              <CountUp target={stat.value} />
            </div>
            <div className="text-[10px] text-purple-300 font-medium mt-0.5">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
