import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import memory1 from "@/assets/memory-1.jpg";
import memory2 from "@/assets/memory-2.jpg";
import memory3 from "@/assets/memory-3.jpg";

const MemoriesVisual = () => (
  <div className="mx-auto w-full max-w-xs rounded-xl border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] p-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="font-['Playfair_Display'] text-sm font-semibold text-[#1f2a1f]">Our Memories</span>
      <span className="text-[10px] text-[#5f6f5f]">Folders + timeline</span>
    </div>

    <div className="grid grid-cols-3 gap-1.5">
      {[memory1, memory2, memory3].map((src, i) => (
        <div key={i} className="aspect-square overflow-hidden rounded-lg">
          <img src={src} alt={`Memory ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>

    <div className="mt-2.5 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-[rgba(192,106,43,0.1)] px-2 py-0.5 text-[10px] text-[#c06a2b]">Starred</span>
      <span className="rounded-full bg-[rgba(192,106,43,0.1)] px-2 py-0.5 text-[10px] text-[#c06a2b]">Tags</span>
      <span className="rounded-full bg-[rgba(192,106,43,0.1)] px-2 py-0.5 text-[10px] text-[#c06a2b]">On This Day</span>
    </div>
  </div>
);

const ChatVisual = () => (
  <div className="mx-auto w-full max-w-xs rounded-xl border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] p-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm">
    <div className="mb-3 flex items-center gap-2 border-b border-[rgba(216,207,194,0.3)] pb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(192,106,43,0.2)] text-xs">US</div>

      <div>
        <div className="text-xs font-semibold text-[#1f2a1f]">Private chat</div>
        <div className="text-[10px] text-[#4a7a4a]">Only you two can access it</div>
      </div>

      <span className="ml-auto text-[10px] text-[#5f6f5f]">Voice + replies</span>
    </div>

    <div className="space-y-2">
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-[#f0ebe3] px-2.5 py-1.5 text-xs">
          Added our Goa photos and pinned the cafe on the travel map.
        </div>
      </div>

      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-xl rounded-br-sm bg-[linear-gradient(135deg,#c06a2b,#caa27a)] px-2.5 py-1.5 text-xs text-[#fef9ec]">
          Perfect. I will add the date to milestones too.
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-xl rounded-bl-sm bg-[#f0ebe3] px-2.5 py-1.5 text-xs">
          Sending you a voice note now.
        </div>
      </div>
    </div>
  </div>
);

const MilestonesVisual = () => (
  <div className="mx-auto w-full max-w-xs rounded-xl border border-[rgba(216,207,194,0.3)] bg-[rgba(253,246,227,0.8)] p-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm">
    <div className="mb-3 flex items-center justify-between">
      <span className="font-['Playfair_Display'] text-sm font-semibold text-[#1f2a1f]">Relationship Timeline</span>
      <span className="text-[10px] font-medium text-[#c06a2b]">Upcoming reminders</span>
    </div>

    <div className="relative space-y-3 pl-5">
      <div className="absolute bottom-1 left-1.5 top-1 w-px bg-[rgba(192,106,43,0.2)]" />

      {[
        { title: "Together since", date: "Dec 2024" },
        { title: "First trip together", date: "Feb 2025" },
        { title: "First long voice note", date: "Mar 2025" },
        { title: "Anniversary reminder", date: "Next week" },
      ].map((m) => (
        <div key={m.title} className="relative">
          <div className="absolute -left-[14px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#fdf6e3] bg-[#c06a2b]" />
          <div className="text-xs font-semibold text-[#1f2a1f]">{m.title}</div>
          <div className="text-[10px] text-[#5f6f5f]">{m.date}</div>
        </div>
      ))}
    </div>
  </div>
);

const showcaseData = [
  {
    tag: "STORE",
    title: "Keep your photos, videos, and story organized.",
    bullets: [
      "Upload media into folders",
      "Star favorites and browse timeline view",
      "Recover deleted media for 14 days",
      "Add tags and love notes to special memories",
    ],
    visual: <MemoriesVisual />,
  },
  {
    tag: "CONNECT",
    title: "Talk privately without mixing it into everyday chat apps.",
    bullets: [
      "Private couple chat with replies and reactions",
      "Voice messages for more personal moments",
      "Presence and read status built into the app",
      "Love notes stay attached to the memories they belong to",
    ],
    visual: <ChatVisual />,
    reverse: true,
  },
  {
    tag: "RELIVE",
    title: "Track milestones, anniversaries, and places together.",
    bullets: [
      "Save important relationship dates",
      "See upcoming reminders and countdowns",
      "Pin shared places on a travel map",
      "Generate a love story card from your journey",
    ],
    visual: <MilestonesVisual />,
  },
];

const Showcase = () => (
  <section id="features" className="py-12 sm:py-16 md:py-20">
    <div className="mx-auto max-w-5xl space-y-12 px-5 sm:px-6 sm:space-y-16">
      {showcaseData.map((item) => (
        <motion.div
          key={item.tag}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className={`flex flex-col items-center gap-6 md:gap-10 ${item.reverse ? "md:flex-row-reverse" : "md:flex-row"}`}
        >
          <div className="flex-1 space-y-3 text-center md:text-left">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#c06a2b] sm:text-xs">
              {item.tag}
            </span>

            <h2 className="font-['Playfair_Display'] text-xl font-bold leading-tight text-[#1f2a1f] sm:text-2xl md:text-3xl">
              {item.title}
            </h2>

            <ul className="inline-block space-y-1.5 text-left">
              {item.bullets.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-xs text-[#1f2a1f] sm:text-sm">
                  <span className="mt-0.5 text-xs text-[#c06a2b]">+</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div>
              <a href="/auth">
                <Button
                  size="sm"
                  className="mt-1 bg-[linear-gradient(135deg,#c06a2b,#caa27a)] text-xs text-[#fef9ec] shadow-[0_4px_20px_-4px_rgba(192,106,43,0.15)] sm:text-sm"
                >
                  Try the free plan
                </Button>
              </a>
            </div>
          </div>

          <div className="w-full max-w-xs flex-1 md:mx-0">{item.visual}</div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default Showcase;
