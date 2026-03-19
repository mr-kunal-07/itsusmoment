import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Lock, Smartphone, Star } from "lucide-react";
import heroCollage from "@/assets/hero-collage.jpg";

const badges = [
  { icon: Check, label: "No credit card" },
  { icon: Lock, label: "Encrypted" },
  { icon: Smartphone, label: "All devices" },
  { icon: Star, label: "4.9★ rated" },
];

const Hero = () => (
  <section className="relative pt-24 pb-10 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16 overflow-hidden bg-[linear-gradient(180deg,#fdf6e3_0%,#f5eddc_100%)]">

    <div className="max-w-5xl mx-auto px-5 sm:px-6 text-center">

      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c06a2b]/10 text-[#c06a2b] text-xs sm:text-sm font-medium mb-5"
      >
        💛 Keep Private Until It's Permanent
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08 }}
        className="font-['Playfair_Display'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1f2a1f] leading-[1.1] tracking-tight mb-4"
      >
        Your story doesn't belong
        <br className="hidden sm:block" />
        <span className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] bg-clip-text text-transparent italic">
          {" "}in a chat history.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="text-sm sm:text-base md:text-lg text-[#5f6f5f] max-w-xl mx-auto mb-6 leading-relaxed"
      >
        Photos, private chat, voice messages, milestones & travel map — in one encrypted vault, just for the two of you.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.22 }}
        className="flex flex-col xs:flex-row items-center justify-center gap-2.5 mb-5"
      >
        <a href="/auth">
          <Button
            size="lg"
            className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] text-sm sm:text-base px-6 sm:px-8 h-11"
          >
            Start for free →
          </Button>
        </a>

        <a href="#features">
          <Button
            size="lg"
            variant="outline"
            className="text-sm sm:text-base px-6 sm:px-8 h-11 border-[#caa27a] bg-transparent hover:bg-[#caa27a]/50"
          >
            See features
          </Button>
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-8"
      >
        {badges.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-1 text-xs sm:text-sm text-[#5f6f5f]">
            <Icon size={12} className="text-[#c06a2b]" />
            {label}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35 }}
        className="relative max-w-3xl mx-auto"
      >
        <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[rgba(216,207,194,0.3)]">
          <img
            src={heroCollage}
            alt="usMoment — your private memory vault for couples"
            className="w-full h-auto object-cover"
            loading="eager"
          />
        </div>

        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[rgba(255,255,255,0.9)] backdrop-blur-sm px-4 py-2 rounded-full shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] border border-[rgba(216,207,194,0.3)] whitespace-nowrap">
          <span className="text-xs sm:text-sm font-medium text-[#1f2a1f]">
            💑 50,000+ couples trust usMoment
          </span>
        </div>
      </motion.div>

    </div>
  </section>
);

export default Hero;