import { motion } from "framer-motion";
import { CalendarHeart, Camera, MapPinned } from "lucide-react";

const useCases = [
  {
    icon: Camera,
    title: "For memory keepers",
    detail: "Keep date-night photos, trip videos, and favorites in one place.",
  },
  {
    icon: CalendarHeart,
    title: "For couples who track milestones",
    detail: "Keep anniversaries, firsts, birthdays, and reminders together.",
  },
  {
    icon: MapPinned,
    title: "For couples building a shared story",
    detail: "Pin places, save notes, and build a story you can revisit anytime.",
  },
];

const Testimonials = () => (
  <section className="py-12 sm:py-16 md:py-20">
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-8 max-w-3xl text-center sm:mb-10"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-[#c06a2b]">
          Who it is for
        </span>

        <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#1f2a1f] sm:text-3xl md:text-4xl">
          Made for couples who want one shared place.
        </h2>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {useCases.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] p-5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(192,106,43,0.1)] text-[#c06a2b]">
              <item.icon size={18} />
            </div>

            <h3 className="mb-2 font-['Playfair_Display'] text-lg font-semibold text-[#1f2a1f]">
              {item.title}
            </h3>

            <p className="text-sm leading-relaxed text-[#5f6f5f]">{item.detail}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
