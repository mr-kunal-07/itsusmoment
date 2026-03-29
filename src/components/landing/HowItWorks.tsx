import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Mail, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Mail,
    title: "Create your account",
    desc: "Sign up in a minute and open your private space.",
  },
  {
    icon: HeartHandshake,
    title: "Connect your partner",
    desc: "Share your invite code or let them join from your link.",
  },
  {
    icon: Sparkles,
    title: "Start saving your story",
    desc: "Add memories, chat, milestones, and places you want to remember.",
  },
];

const HowItWorks = () => (
  <section
    id="how-it-works"
    className="border-y border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.6)] py-12 sm:py-16 md:py-20"
  >
    <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="md:sticky md:top-24 md:self-start"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-[#c06a2b]">
          How it works
        </span>

        <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#1f2a1f] sm:text-3xl md:text-4xl">
          Start together in three simple steps.
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5f6f5f] sm:text-base">
          Create your account, invite your partner, and begin building one private place for your relationship.
        </p>

        <div className="mt-6 rounded-3xl border border-[rgba(216,207,194,0.35)] bg-[rgba(255,251,244,0.7)] p-4 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#c06a2b]">
            What happens next
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#5f6f5f]">
            Once both of you join, you share the same private space for memories, chat, milestones, and plans.
          </p>
        </div>

        <div className="mt-6">
          <a href="/auth">
            <Button className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-6 text-sm text-[#fef9ec] shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)]">
              Start with the free plan
            </Button>
          </a>
        </div>
      </motion.div>

      <div className="relative pl-6 sm:pl-8">
        <div className="absolute bottom-0 left-3 top-0 w-px bg-[linear-gradient(180deg,rgba(192,106,43,0.35),rgba(192,106,43,0.08))] sm:left-4" />

        <div className="space-y-5 sm:space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative rounded-3xl border border-[rgba(216,207,194,0.35)] bg-[rgba(255,251,244,0.78)] p-5 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.32)]"
            >
              <div className="absolute left-[-31px] top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#fdf6e3] bg-[#c06a2b] text-[10px] font-semibold text-[#fff8ef] sm:left-[-37px] sm:h-7 sm:w-7">
                {i + 1}
              </div>

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(192,106,43,0.12)] text-[#c06a2b]">
                <step.icon size={18} />
              </div>

              <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#1f2a1f] sm:text-xl">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#5f6f5f] sm:text-base">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
