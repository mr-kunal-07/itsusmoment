import { motion } from "framer-motion";
import { CreditCard, Lock, Smartphone, Users } from "lucide-react";

const badges = [
  { icon: Users, title: "Built for couples", desc: "One shared space for two people" },
  { icon: Lock, title: "Privacy-first", desc: "Private chat and protected access" },
  { icon: Smartphone, title: "Installable PWA", desc: "Use it like an app on any device" },
  { icon: CreditCard, title: "Razorpay billing", desc: "Simple payments for India" },
];

const TrustBadges = () => (
  <section className="py-8 sm:py-10">
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-5">
        {badges.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.75)] px-3 py-4 text-center"
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(192,106,43,0.1)] text-[#c06a2b]">
              <b.icon size={16} />
            </div>

            <h4 className="text-xs font-semibold text-[#1f2a1f] sm:text-sm">{b.title}</h4>
            <p className="mt-1 text-[10px] text-[#5f6f5f] sm:text-[11px]">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
