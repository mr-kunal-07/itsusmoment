import { motion } from "framer-motion";

const stats = [
  { value: "10K+", label: "couples creating their private space" },
  { value: "250K+", label: "memories saved together" },
  { value: "1M+", label: "messages, notes, and little moments shared" },
  { value: "4.9/5", label: "love from couples who use usMoments" },
];

const Stats = () => (
  <section className="border-y border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.6)] py-8 sm:py-10">
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#c06a2b]">
          Loved by couples
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl border border-[rgba(216,207,194,0.4)] bg-[rgba(255,251,244,0.7)] px-3 py-4 text-center sm:px-4 sm:py-5"
          >
            <div className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] bg-clip-text font-['Playfair_Display'] text-xl font-bold text-transparent sm:text-3xl">
              {s.value}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#5f6f5f] sm:text-xs">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Stats;
