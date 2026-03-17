import { motion } from "framer-motion";
import { Lock, Shield, Smartphone, Ban } from "lucide-react";

const badges = [
  { icon: Lock, title: "E2E encrypted", desc: "AES-256-GCM" },
  { icon: Shield, title: "Zero-knowledge", desc: "We can't read your data" },
  { icon: Smartphone, title: "PWA ready", desc: "Install on any device" },
  { icon: Ban, title: "No ads ever", desc: "Your data stays yours" },
];

const TrustBadges = () => (
  <section className="py-8 sm:py-10">
    <div className="max-w-4xl mx-auto px-5 sm:px-6">

      <div className="grid grid-cols-4 gap-3 sm:gap-5">
        {badges.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="text-center"
          >

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[rgba(192,106,43,0.1)] flex items-center justify-center mx-auto mb-2 text-[#c06a2b]">
              <b.icon size={16} />
            </div>

            <h4 className="text-[10px] sm:text-xs font-semibold text-[#1f2a1f]">
              {b.title}
            </h4>

            <p className="text-[9px] sm:text-[10px] text-[#5f6f5f] hidden sm:block">
              {b.desc}
            </p>

          </motion.div>
        ))}
      </div>

    </div>
  </section>
);

export default TrustBadges;