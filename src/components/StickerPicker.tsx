import { useState } from "react";
import { X } from "lucide-react";

const STICKER_CATEGORIES = [
  {
    name: "Love",
    stickers: ["💕", "💖", "💗", "💘", "💝", "💞", "💓", "❤️‍🔥", "🥰", "😍", "😘", "💋", "🫶", "❣️", "💑", "👩‍❤️‍👨"],
  },
  {
    name: "Cute",
    stickers: ["🐻", "🐰", "🦋", "🌸", "🌺", "🍓", "🧸", "🐱", "🐶", "🦄", "🌈", "⭐", "🎀", "🍰", "🧁", "🍩"],
  },
  {
    name: "Mood",
    stickers: ["🤗", "😊", "🥺", "😏", "🤭", "😜", "🙈", "🙉", "🙊", "💃", "🕺", "🎉", "🎊", "✨", "🔮", "🎭"],
  },
  {
    name: "Fun",
    stickers: ["🎵", "🎶", "🌙", "☀️", "🌻", "🍕", "🍿", "🧋", "☕", "🍷", "🥂", "🏖️", "✈️", "🎡", "🎢", "🎠"],
  },
];

interface Props {
  onSelect: (sticker: string) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState(0);

  return (
    <div
      className="rounded-2xl border border-border shadow-xl overflow-hidden"
      style={{ background: "hsl(var(--wa-header))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold" style={{ color: "hsl(var(--wa-text))" }}>Stickers</span>
        <button onClick={onClose} className="p-1 rounded-full" style={{ color: "hsl(var(--wa-text) / 0.5)" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setTab(i)}
            className="flex-1 py-1.5 text-[10px] font-medium transition-colors"
            style={{
              color: tab === i ? "hsl(var(--wa-online))" : "hsl(var(--wa-text) / 0.5)",
              borderBottom: tab === i ? "2px solid hsl(var(--wa-online))" : "2px solid transparent",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-8 gap-1 p-2 max-h-40 overflow-y-auto">
        {STICKER_CATEGORIES[tab].stickers.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="text-2xl h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent/20 active:scale-110 transition-transform"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
