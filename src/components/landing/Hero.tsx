import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Lock, MapPinned, MessageCircleHeart, ShieldCheck, TimerReset } from "lucide-react";
import heroCollage from "@/assets/hero-collage.jpg";

const quickPoints = [
  { icon: Heart, label: "A private space for two" },
  { icon: MessageCircleHeart, label: "Chat, memories, and milestones" },
  { icon: TimerReset, label: "Set up in under a minute" },
];

const trustPoints = [
  { icon: Lock, label: "Chat and love notes are encrypted" },
  { icon: ShieldCheck, label: "App lock and couple-only access" },
  { icon: MapPinned, label: "Works on phone, desktop, and as an installable app" },
];

const Hero = () => (
  <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fdf6e3_0%,#f5eddc_100%)] pt-24 pb-10 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(192,106,43,0.16),transparent_60%)]" />

    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 md:gap-10 md:grid-cols-[1.05fr_0.95fr]">
      <div className="text-center md:text-left">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full bg-[#c06a2b]/10 px-3 py-1 text-center text-xs font-medium text-[#c06a2b] sm:text-sm"
        >
          Private shared space for couples
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mb-4 font-['Playfair_Display'] text-3xl font-bold leading-[1.08] tracking-tight text-[#1f2a1f] sm:text-4xl md:text-5xl lg:text-6xl"
        >
          Save your relationship in
          <span className="italic text-[#c06a2b]"> one private place</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-[#5f6f5f] sm:text-base md:mx-0 md:text-lg"
        >
          Keep photos, private chat, milestones, and travel memories together in one app made for couples.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="mb-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center md:justify-start"
        >
          <a href="/auth" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="h-11 w-full border-0 bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-6 text-sm text-[#fef9ec] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] sm:w-auto sm:px-8 sm:text-base"
            >
              Create your shared space
            </Button>
          </a>

          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="h-11 w-full border-[#caa27a] bg-transparent px-6 text-sm hover:bg-[#caa27a]/15 sm:w-auto sm:px-8 sm:text-base"
            >
              See how it works
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 grid gap-2 sm:grid-cols-3"
        >
          {quickPoints.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-[rgba(216,207,194,0.5)] bg-[rgba(255,252,246,0.75)] px-3 py-3 text-left shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] backdrop-blur-sm"
            >
              <Icon size={15} className="mb-2 text-[#c06a2b]" />
              <p className="text-sm font-medium text-[#1f2a1f]">{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.34 }}
          className="flex flex-col gap-2 text-left"
        >
          {trustPoints.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-[#5f6f5f] sm:text-sm">
              <Icon size={13} className="shrink-0 text-[#c06a2b]" />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35 }}
        className="relative mx-auto w-full max-w-2xl pb-20 sm:pb-16"
      >
        <div className="overflow-hidden rounded-[28px] border border-[rgba(216,207,194,0.45)] bg-white/40 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <img
            src={heroCollage}
            alt="usMoment dashboard showing private memories, chat, and relationship moments"
            width={768}
            height={432}
            className="w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        <div className="absolute bottom-0 left-1/2 w-[92%] -translate-x-1/2 rounded-2xl border border-[rgba(216,207,194,0.4)] bg-[rgba(255,251,244,0.92)] px-4 py-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:w-auto sm:min-w-[360px]">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c06a2b]">Store</p>
              <p className="text-xs font-medium text-[#1f2a1f] sm:text-sm">Photos, videos, timeline</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c06a2b]">Connect</p>
              <p className="text-xs font-medium text-[#1f2a1f] sm:text-sm">Private chat, voice notes</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c06a2b]">Relive</p>
              <p className="text-xs font-medium text-[#1f2a1f] sm:text-sm">Milestones, anniversaries, travel map</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default Hero;
