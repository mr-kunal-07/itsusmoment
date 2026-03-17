import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="py-14 sm:py-16 md:py-20 bg-[rgba(253,246,227,0.6)] border-t border-[rgba(216,207,194,0.3)]">
    <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >

        <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-4xl font-bold text-[#1f2a1f] leading-tight mb-4">
          Your love story deserves
          <span className="italic bg-[linear-gradient(135deg,#c06a2b,#caa27a)] bg-clip-text text-transparent">
            {" "}a home that lasts.
          </span>
        </h2>

        <p className="text-[#5f6f5f] text-sm sm:text-base mb-6 max-w-md mx-auto">
          Join 50,000+ couples who trust usMoment with their most precious moments.
        </p>

        <a href="https://itsusmoment.lovable.app/auth">
          <Button
            size="lg"
            className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0 shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)] text-sm sm:text-base px-8 h-11"
          >
            Start your story — free 💛
          </Button>
        </a>

        <p className="text-[10px] sm:text-xs text-[#5f6f5f] mt-3">
          Free to start · Always private · No credit card
        </p>

      </motion.div>

    </div>
  </section>
);

export default FinalCTA;