import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="border-t border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.6)] py-14 sm:py-16 md:py-20">
    <div className="mx-auto max-w-2xl px-5 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="mb-4 font-['Playfair_Display'] text-2xl font-bold leading-tight text-[#1f2a1f] sm:text-3xl md:text-4xl">
          Start with the free plan and build your shared space today.
        </h2>

        <p className="mx-auto mb-6 max-w-md text-sm text-[#5f6f5f] sm:text-base">
          Create your account, invite your partner, and begin saving your memories, messages,
          and milestones in one private place.
        </p>

        <a href="/auth">
          <Button
            size="lg"
            className="h-11 border-0 bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-8 text-sm text-[#fef9ec] shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)] sm:text-base"
          >
            Create your account
          </Button>
        </a>

        <p className="mt-3 text-[10px] text-[#5f6f5f] sm:text-xs">
          Free plan available. One upgrade covers both partners.
        </p>
      </motion.div>
    </div>
  </section>
);

export default FinalCTA;
