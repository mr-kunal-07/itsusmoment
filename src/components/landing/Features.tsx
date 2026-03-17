import { motion } from "framer-motion";
import { Lock, Image, MessageCircle, Calendar, MapPin, Pen, Mic, ListChecks, Heart } from "lucide-react";

const features = [
  { icon: Lock, tag: "Privacy", title: "End-to-end encrypted", desc: "Every photo, video, note and message is encrypted. Nobody — not even us — can read it." },
  { icon: Image, tag: "Memories", title: "Private media vault", desc: "Upload in original quality. Organize into folders, star favourites, browse a timeline." },
  { icon: MessageCircle, tag: "Chat", title: "Private chat room", desc: "Voice messages, emoji reactions, reply threads, read receipts — just for you two." },
  { icon: Calendar, tag: "Timeline", title: "Milestones & dates", desc: "Log every first. Get smart reminders before every special date." },
  { icon: MapPin, tag: "Travel", title: "Travel map", desc: "Pin every place you've visited together on a beautiful interactive map." },
  { icon: Pen, tag: "Notes", title: "Love notes", desc: "Attach heartfelt notes to any photo. Visible only to your partner." },
  { icon: Mic, tag: "Voice", title: "Voice messages", desc: "Send warm voice notes. Richer than text, more intimate than ever." },
  { icon: ListChecks, tag: "Goals", title: "Bucket list", desc: "Build a shared list of things to do, places to visit together." },
  { icon: Heart, tag: "Special", title: "Love story card", desc: "A beautiful shareable card from your milestones, photos & timeline." },
];

const Features = () => (
  <section id="features" className="py-14 sm:py-16 md:py-20">

    <div className="max-w-5xl mx-auto px-5 sm:px-6">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <span className="text-xs font-medium text-[#c06a2b] tracking-wider uppercase">
          Everything you need
        </span>

        <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-4xl font-bold text-[#1f2a1f] mt-2">
          One vault for your{" "}
          <span className="italic bg-[linear-gradient(135deg,#c06a2b,#caa27a)] bg-clip-text text-transparent">
            entire relationship.
          </span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">

        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="group bg-[rgba(253,246,227,0.8)] backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-[rgba(216,207,194,0.3)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] hover:border-[rgba(192,106,43,0.2)] transition-all duration-300"
          >

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[rgba(192,106,43,0.1)] flex items-center justify-center text-[#c06a2b] group-hover:bg-[#c06a2b] group-hover:text-[#fef9ec] transition-colors duration-300 mb-2.5">
              <f.icon size={16} />
            </div>

            <h3 className="font-['Playfair_Display'] text-sm sm:text-base font-semibold text-[#1f2a1f] mb-1">
              {f.title}
            </h3>

            <p className="text-xs sm:text-sm text-[#5f6f5f] leading-relaxed line-clamp-3">
              {f.desc}
            </p>

          </motion.div>
        ))}

      </div>
    </div>
  </section>
);

export default Features;