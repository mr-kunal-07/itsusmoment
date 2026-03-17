import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "usMoment is the only place we genuinely feel close. The voice messages make it feel like they're right there.",
    name: "Priya & Arjun",
    detail: "487 days · Long-distance",
    plan: "Soulmate",
  },
  {
    quote: "Every trip, every date night — it's all here. We open it every morning over coffee. Our private world.",
    name: "Sneha & Rahul",
    detail: "1,204 days · Mumbai",
    plan: "Dating",
  },
  {
    quote: "I wrote a love note on our first photo. She cried. That moment alone was worth everything.",
    name: "Rohan M.",
    detail: "Bangalore",
    plan: "Dating",
  },
];

const Testimonials = () => (
  <section className="py-12 sm:py-16 md:py-20">
    <div className="max-w-5xl mx-auto px-5 sm:px-6">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-10"
      >
        <span className="text-xs font-medium text-[#c06a2b] tracking-wider uppercase">
          Real couples
        </span>

        <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-4xl font-bold text-[#1f2a1f] mt-2">
          Loved by couples <span className="italic">all over India.</span>
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="bg-[rgba(253,246,227,0.8)] backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-[rgba(216,207,194,0.3)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
          >

            <div className="text-3xl text-[rgba(192,106,43,0.25)] font-['Playfair_Display'] leading-none mb-1">
              "
            </div>

            <p className="text-[#1f2a1f] font-['Playfair_Display'] italic text-sm leading-relaxed mb-4">
              {t.quote}
            </p>

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-full bg-[rgba(192,106,43,0.1)] flex items-center justify-center text-sm font-['Playfair_Display'] font-bold text-[#c06a2b]">
                {t.name[0]}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#1f2a1f] truncate">
                  {t.name}
                </div>
                <div className="text-[10px] text-[#5f6f5f]">
                  {t.detail}
                </div>
              </div>

              <span className="ml-auto text-[10px] bg-[rgba(192,106,43,0.1)] text-[#c06a2b] px-1.5 py-0.5 rounded-full shrink-0">
                {t.plan}
              </span>

            </div>

          </motion.div>
        ))}
      </div>

    </div>
  </section>
);

export default Testimonials;