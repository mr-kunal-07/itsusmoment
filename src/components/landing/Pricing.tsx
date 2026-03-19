import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    emoji: "🌱", name: "Dating", tagline: "Start free.",
    price: "Free", period: "forever",
    features: ["1 GB storage", "50+50 uploads/mo", "Private chat + calls", "Milestone calendar", "Travel map", "Love story card"],
    cta: "Get started free", highlight: false,
  },
  {
    emoji: "💑", name: "Soulmate", tagline: "Unlock everything.",
    price: "₹29", period: "/mo", badge: "BEST VALUE",
    features: ["10 GB storage", "Unlimited uploads", "Voice messages", "Love notes on photos", "Activity feed", "Priority support"],
    cta: "Get Soulmate", highlight: true,
  },
  {
    emoji: "💎", name: "Marriage", tagline: "No limits. Forever.",
    price: "₹99", period: "/mo", badge: "POPULAR",
    features: ["50 GB storage", "Everything in Soulmate", "Slideshow mode", "Early beta access", "Partner plan sharing", "Lifetime lock-in"],
    cta: "Go Marriage", highlight: false,
  },
];

const Pricing = () => (
  <section
    id="pricing"
    className="py-12 sm:py-16 md:py-20 bg-[rgba(253,246,227,0.6)] border-y border-[rgba(216,207,194,0.3)]"
  >
    <div className="max-w-5xl mx-auto px-5 sm:px-6">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-10"
      >
        <span className="text-xs font-medium text-[#c06a2b] tracking-wider uppercase">
          Pricing
        </span>

        <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-4xl font-bold text-[#1f2a1f] mt-2">
          Simple, honest pricing.
        </h2>

        <p className="text-xs sm:text-sm text-[#c06a2b] font-medium mt-2">
          One subscription covers both of you
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={`relative rounded-xl p-4 sm:p-5 border ${p.highlight
              ? "bg-[#fdf6e3] border-[#c06a2b] shadow-[0_16px_50px_-10px_rgba(0,0,0,0.18)] sm:scale-[1.03]"
              : "bg-[rgba(253,246,227,0.8)] border-[rgba(216,207,194,0.3)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
              }`}
          >

            {p.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[#fef9ec] bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {p.badge}
              </span>
            )}

            <div className="text-2xl mb-2">{p.emoji}</div>

            <h3 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-[#1f2a1f]">
              {p.name}
            </h3>

            <p className="text-[10px] sm:text-xs text-[#5f6f5f] mb-3">
              {p.tagline}
            </p>

            <div className="mb-4">
              <span className="text-2xl sm:text-3xl font-['Playfair_Display'] font-bold text-[#1f2a1f]">
                {p.price}
              </span>
              <span className="text-xs text-[#5f6f5f] ml-0.5">
                {p.period}
              </span>
            </div>

            <ul className="space-y-1.5 mb-4">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs sm:text-sm text-[#1f2a1f]">
                  <Check size={12} className="text-[#c06a2b] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <a href="/auth" className="block">
              <Button
                size="sm"
                className={`w-full text-xs sm:text-sm ${p.highlight
                  ? "bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0 shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)]"
                  : "bg-transparent border border-[#c06a2b] text-[#c06a2b] hover:bg-[rgba(192,106,43,0.05)]"
                  }`}
              >
                {p.cta}
              </Button>
            </a>

          </motion.div>
        ))}
      </div>

      <p className="text-center text-[10px] sm:text-xs text-[#5f6f5f] mt-6">
        Cancel anytime · No hidden fees · Payments via Razorpay
      </p>

    </div>
  </section>
);

export default Pricing;