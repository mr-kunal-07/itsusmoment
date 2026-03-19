import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import memory1 from "@/assets/memory-1.jpg";
import memory2 from "@/assets/memory-2.jpg";
import memory3 from "@/assets/memory-3.jpg";

const MemoriesVisual = () => (
  <div className="bg-[rgba(253,246,227,0.8)] backdrop-blur-sm rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[rgba(216,207,194,0.3)] p-3 sm:p-4 w-full max-w-xs mx-auto">
    <div className="flex items-center justify-between mb-3">
      <span className="font-['Playfair_Display'] text-sm font-semibold text-[#1f2a1f]">Our Memories</span>
      <span className="text-[10px] text-[#5f6f5f]">47 photos</span>
    </div>

    <div className="grid grid-cols-3 gap-1.5">
      {[memory1, memory2, memory3].map((src, i) => (
        <div key={i} className="aspect-square rounded-lg overflow-hidden">
          <img src={src} alt={`Memory ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>

    <div className="mt-2.5 flex flex-wrap gap-1.5">
      <span className="text-[10px] bg-[rgba(192,106,43,0.1)] text-[#c06a2b] px-2 py-0.5 rounded-full">Goa 🌊</span>
      <span className="text-[10px] bg-[rgba(192,106,43,0.1)] text-[#c06a2b] px-2 py-0.5 rounded-full">Date Night 🕯️</span>
    </div>
  </div>
);

const ChatVisual = () => (
  <div className="bg-[rgba(253,246,227,0.8)] backdrop-blur-sm rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[rgba(216,207,194,0.3)] p-3 sm:p-4 w-full max-w-xs mx-auto">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgba(216,207,194,0.3)]">
      <div className="w-7 h-7 rounded-full bg-[rgba(192,106,43,0.2)] flex items-center justify-center text-xs">💑</div>

      <div>
        <div className="text-xs font-semibold text-[#1f2a1f]">Priya</div>
        <div className="text-[10px] text-[#4a7a4a]">● Online</div>
      </div>

      <span className="ml-auto text-[10px] text-[#5f6f5f]">🔒</span>
    </div>

    <div className="space-y-2">
      <div className="flex justify-start">
        <div className="bg-[#f0ebe3] px-2.5 py-1.5 rounded-xl rounded-bl-sm text-xs max-w-[80%]">
          Remember our first date? 🥹
        </div>
      </div>

      <div className="flex justify-end">
        <div className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] px-2.5 py-1.5 rounded-xl rounded-br-sm text-xs max-w-[80%]">
          How could I ever forget 😄
        </div>
      </div>

      <div className="flex justify-start">
        <div className="bg-[#f0ebe3] px-2.5 py-1.5 rounded-xl rounded-bl-sm text-xs max-w-[80%]">
          Added photos from Goa 🌊
        </div>
      </div>
    </div>
  </div>
);

const MilestonesVisual = () => (
  <div className="bg-[rgba(253,246,227,0.8)] backdrop-blur-sm rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] border border-[rgba(216,207,194,0.3)] p-3 sm:p-4 w-full max-w-xs mx-auto">

    <div className="flex items-center justify-between mb-3">
      <span className="font-['Playfair_Display'] text-sm font-semibold text-[#1f2a1f]">Milestones</span>
      <span className="text-[10px] text-[#c06a2b] font-medium">461 days ❤️</span>
    </div>

    <div className="relative pl-5 space-y-3">
      <div className="absolute left-1.5 top-1 bottom-1 w-px bg-[rgba(192,106,43,0.2)]" />

      {[
        { emoji: "💑", title: "Together Since", date: "Dec 2024" },
        { emoji: "💬", title: "First 'I Love You'", date: "Jan 2025" },
        { emoji: "✈️", title: "Goa Trip", date: "Feb 2025" },
        { emoji: "💍", title: "Engagement", date: "Today 🎉" },
      ].map((m, i) => (
        <div key={i} className="relative">

          <div className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-[#c06a2b] border-2 border-[#fdf6e3]" />

          <div className="text-xs font-semibold text-[#1f2a1f]">
            {m.emoji} {m.title}
          </div>

          <div className="text-[10px] text-[#5f6f5f]">
            {m.date}
          </div>

        </div>
      ))}
    </div>
  </div>
);

const showcaseData = [
  {
    tag: "PRIVATE MEMORIES",
    title: "Every memory. One beautiful place.",
    bullets: ["Timeline with smart date grouping", "Love notes on photos", "Emoji reactions", "14-day recovery"],
    visual: <MemoriesVisual />,
  },
  {
    tag: "PRIVATE CHAT",
    title: "Your own corner of the internet.",
    bullets: ["End-to-end encrypted", "Voice messages", "Swipe-to-reply", "Auto-purge option"],
    visual: <ChatVisual />,
    reverse: true,
  },
  {
    tag: "MILESTONES",
    title: "Log every first. Relive every one.",
    bullets: ["Custom milestone types", "Smart reminders", "Photo attachments", "Days-together counter"],
    visual: <MilestonesVisual />,
  },
];

const Showcase = () => (
  <section className="py-12 sm:py-16 md:py-20">
    <div className="max-w-5xl mx-auto px-5 sm:px-6 space-y-12 sm:space-y-16">

      {showcaseData.map((item) => (
        <motion.div
          key={item.tag}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className={`flex flex-col ${item.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-6 md:gap-10 items-center`}
        >

          <div className="flex-1 space-y-3 text-center md:text-left">

            <span className="text-[10px] sm:text-xs font-medium text-[#c06a2b] tracking-wider uppercase">
              {item.tag}
            </span>

            <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl md:text-3xl font-bold text-[#1f2a1f] leading-tight">
              {item.title}
            </h2>

            <ul className="space-y-1.5 inline-block text-left">
              {item.bullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-xs sm:text-sm text-[#1f2a1f]">
                  <span className="text-[#c06a2b] text-xs">✓</span> {b}
                </li>
              ))}
            </ul>

            <div>
              <a href="/auth">
                <Button
                  size="sm"
                  className="bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-[#fef9ec] border-0 shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)] text-xs sm:text-sm mt-1"
                >
                  Get started free
                </Button>
              </a>
            </div>

          </div>

          <div className="flex-1 w-full max-w-xs mx-auto md:mx-0">
            {item.visual}
          </div>

        </motion.div>
      ))}

    </div>
  </section>
);

export default Showcase;