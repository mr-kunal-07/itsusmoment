import { motion } from "framer-motion";

const stats = [
  { value: "50K+", label: "Couples" },
  { value: "2M+", label: "Memories" },
  { value: "4.9★", label: "Rating" },
  { value: "100%", label: "Private" },
];

const Stats = () => (
  <section className="py-8 sm:py-10 bg-[rgba(253,246,227,0.6)] border-y border-[rgba(216,207,194,0.3)]">

    <div className="max-w-5xl mx-auto px-5 sm:px-6">

      <div className="grid grid-cols-4 gap-3 sm:gap-6">

        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="text-center"
          >

            <div className="text-xl sm:text-2xl md:text-3xl font-['Playfair_Display'] font-bold bg-[linear-gradient(135deg,#c06a2b,#caa27a)] bg-clip-text text-transparent">
              {s.value}
            </div>

            <div className="text-[10px] sm:text-xs text-[#5f6f5f] mt-0.5">
              {s.label}
            </div>

          </motion.div>
        ))}

      </div>
    </div>
  </section>
);

export default Stats;