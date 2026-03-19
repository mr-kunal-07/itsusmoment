import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const steps = [
  { num: "01", title: "Create account", desc: "Sign up free in 60 seconds." },
  { num: "02", title: "Invite partner", desc: "Share a unique invite code." },
  { num: "03", title: "Build together", desc: "Photos, chat, milestones — go." },
];

const HowItWorks = () => (
  <section
    id="how-it-works"
    className="py-12 sm:py-16 md:py-20 bg-[rgba(253,246,227,0.6)] border-y border-[rgba(216,207,194,0.3)]"
  >
    <div className="max-w-4xl mx-auto px-5 sm:px-6 text-center">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-10"
      >
        <span className="text-xs font-medium text-[#c06a2b] tracking-wider uppercase">
          Quick start
        </span>

        <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-4xl font-bold text-[#1f2a1f] mt-2">
          Ready in under a minute.
        </h2>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="text-2xl sm:text-4xl font-['Playfair_Display'] font-bold bg-[linear-gradient(135deg,#c06a2b,#caa27a)] bg-clip-text text-transparent mb-2">
              {s.num}
            </div>

            <h3 className="font-['Playfair_Display'] text-xs sm:text-sm md:text-base font-semibold text-[#1f2a1f] mb-1">
              {s.title}
            </h3>

            <p className="text-[10px] sm:text-xs text-[#5f6f5f]">
              {s.desc}
            </p>
          </motion.div>
        ))}
      </div>

      <a href="/auth">
        <Button
          className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0 shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)] text-sm px-6"
        >
          Create your vault — free
        </Button>
      </a>

    </div>
  </section>
);

export default HowItWorks;