import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    icon: "S",
    name: "Single",
    tagline: "Start free.",
    price: "Free",
    period: "forever",
    features: [
      "1 GB shared storage",
      "50 uploads per partner",
      "Private chat + timeline",
      "Travel map + love story card",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    icon: "D",
    name: "Dating",
    tagline: "More room for memories.",
    price: "Rs29",
    period: "/month",
    badge: "Best value",
    features: [
      "10 GB shared storage",
      "Unlimited uploads",
      "Voice messages + reactions",
      "One plan covers both partners",
    ],
    cta: "Choose Dating",
    highlight: true,
  },
  {
    icon: "SM",
    name: "Soulmate",
    tagline: "Everything unlocked.",
    price: "Rs99",
    period: "/month",
    badge: "Most complete",
    features: [
      "50 GB shared storage",
      "Unlimited uploads",
      "Priority support",
      "All premium features",
    ],
    cta: "Choose Soulmate",
    highlight: false,
  },
];

const Pricing = () => (
  <section
    id="pricing"
    className="overflow-x-hidden border-y border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.6)] py-12 sm:py-16 md:py-20"
  >
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-8 max-w-2xl text-center sm:mb-10"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-[#c06a2b]">
          Pricing
        </span>

        <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#1f2a1f] sm:text-3xl md:text-4xl">
          Simple plans for both of you.
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#5f6f5f] sm:text-base">
          One upgrade covers both partners.
        </p>
      </motion.div>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <div className="flex gap-4 md:grid md:max-w-4xl md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`relative w-[82vw] min-w-[82vw] snap-center rounded-2xl border p-4 sm:w-[360px] sm:min-w-[360px] sm:p-5 md:w-auto md:min-w-0 ${
                p.highlight
                  ? "border-[#c06a2b] bg-[#fdf6e3] shadow-[0_16px_50px_-10px_rgba(0,0,0,0.18)] md:scale-[1.03]"
                  : "border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-2.5 py-0.5 text-[10px] font-semibold text-[#fef9ec]">
                  {p.badge}
                </span>
              )}

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(192,106,43,0.12)] text-xs font-semibold text-[#c06a2b]">
                {p.icon}
              </div>

              <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1f2a1f]">
                {p.name}
              </h3>

              <p className="mb-3 text-xs text-[#5f6f5f]">{p.tagline}</p>

              <div className="mb-4">
                <span className="font-['Playfair_Display'] text-3xl font-bold text-[#1f2a1f]">
                  {p.price}
                </span>
                <span className="ml-0.5 text-xs text-[#5f6f5f]">{p.period}</span>
              </div>

              <ul className="mb-5 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#1f2a1f] sm:text-sm">
                    <Check size={13} className="mt-0.5 shrink-0 text-[#c06a2b]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a href="/auth" className="block">
                <Button
                  size="sm"
                  className={`w-full text-xs sm:text-sm ${
                    p.highlight
                      ? "border-0 bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)]"
                      : "border border-[#c06a2b] bg-transparent text-[#c06a2b] hover:bg-[rgba(192,106,43,0.05)]"
                  }`}
                >
                  {p.cta}
                </Button>
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-[#5f6f5f] sm:text-xs">
        Pay securely with UPI. Google Pay and PhonePe open on supported devices, with QR fallback for other UPI apps.
      </p>
    </div>
  </section>
);

export default Pricing;
