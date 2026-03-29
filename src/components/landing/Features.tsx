import { motion } from "framer-motion";
import {
  FolderHeart,
  Image,
  Lock,
  MapPinned,
  Mic,
  Shield,
  Smartphone,
  Sparkles,
  Tags,
} from "lucide-react";

const features = [
  {
    icon: FolderHeart,
    tag: "Shared vault",
    title: "Photos and videos in one place",
    desc: "Upload memories, sort them into folders, and revisit them in timeline view.",
  },
  {
    icon: Lock,
    tag: "Private chat",
    title: "Couples-only chat and love notes",
    desc: "Send private messages, reactions, and love notes attached to special photos.",
  },
  {
    icon: Mic,
    tag: "Voice",
    title: "Voice messages that feel personal",
    desc: "Share voice notes when text is not enough.",
  },
  {
    icon: Sparkles,
    tag: "Milestones",
    title: "Remember every first",
    desc: "Track anniversaries, birthdays, and important dates with reminders.",
  },
  {
    icon: MapPinned,
    tag: "Travel map",
    title: "Pin the places you shared",
    desc: "Save trips, date spots, and meaningful places on one shared map.",
  },
  {
    icon: Tags,
    tag: "Organize",
    title: "Tags, filters, and search",
    desc: "Find memories quickly with tags, search, and favorites.",
  },
  {
    icon: Shield,
    tag: "Safety",
    title: "Built for privacy on shared devices",
    desc: "Use PIN or biometric app lock for extra privacy.",
  },
  {
    icon: Smartphone,
    tag: "Everywhere",
    title: "Works like an app on any device",
    desc: "Use it on mobile or desktop and install it like an app.",
  },
  {
    icon: Image,
    tag: "Recovery",
    title: "Deleted by mistake? Recover it",
    desc: "Restore deleted items for 14 days.",
  },
];

const Features = () => (
  <section id="features" className="py-14 sm:py-16 md:py-20">
    <div className="mx-auto max-w-6xl px-5 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-10 max-w-3xl text-center"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-[#c06a2b]">
          What you can do
        </span>

        <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#1f2a1f] sm:text-3xl md:text-4xl">
          Everything a couple needs, without the noise of a social network.
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#5f6f5f] sm:text-base">
          Everything important in one place, instead of across multiple apps.
        </p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="group rounded-2xl border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] p-5 backdrop-blur-sm transition-all duration-300 hover:border-[rgba(192,106,43,0.2)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-3 inline-flex rounded-full bg-[rgba(192,106,43,0.1)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c06a2b]">
              {f.tag}
            </div>

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(192,106,43,0.1)] text-[#c06a2b] transition-colors duration-300 group-hover:bg-[#c06a2b] group-hover:text-[#fef9ec]">
              <f.icon size={18} />
            </div>

            <h3 className="mb-2 font-['Playfair_Display'] text-lg font-semibold text-[#1f2a1f]">
              {f.title}
            </h3>

            <p className="text-sm leading-relaxed text-[#5f6f5f]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
