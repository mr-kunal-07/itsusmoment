import { useState, useEffect, useCallback } from "react";
import { Media, getPublicUrl } from "@/hooks/useMedia";
import { Play, X, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  media: Media[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
}

const SLIDE_DURATION = 4000; // ms per slide

export function Slideshow({ media, startIndex = 0, open, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const [fade, setFade] = useState(true);

  const images = media.filter(m => m.file_type === "image");

  const goTo = useCallback((next: number) => {
    setFade(false);
    setTimeout(() => {
      setIndex(next);
      setFade(true);
    }, 300);
  }, []);

  const prev = useCallback(() => {
    goTo((index - 1 + images.length) % images.length);
  }, [index, images.length, goTo]);

  const next = useCallback(() => {
    goTo((index + 1) % images.length);
  }, [index, images.length, goTo]);

  // Auto-advance
  useEffect(() => {
    if (!playing || !open) return;
    const timer = setTimeout(() => next(), SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [playing, open, index, next]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === " ") { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next, onClose]);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  if (!open || images.length === 0) return null;

  const item = images[index];
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110"
        style={{ backgroundImage: `url(${getPublicUrl(item.file_path)})` }}
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setPlaying(p => !p)}
          className="h-9 w-9 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm flex items-center justify-center text-foreground transition-colors"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm flex items-center justify-center text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <span className="text-xs font-medium bg-background/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-foreground/80">
          {index + 1} / {images.length}
        </span>
      </div>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm flex items-center justify-center text-foreground transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm flex items-center justify-center text-foreground transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Image */}
      <div className={cn("relative z-0 w-full h-full flex items-center justify-center transition-opacity duration-300", fade ? "opacity-100" : "opacity-0")}>
        <img
          key={item.id}
          src={getPublicUrl(item.file_path)}
          alt={item.title}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Caption */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-10 px-8 py-6 bg-gradient-to-t from-background/70 to-transparent transition-opacity duration-300",
        fade ? "opacity-100" : "opacity-0"
      )}>
        <p className="text-center text-foreground font-medium font-heading text-lg">{item.title}</p>
        {item.description && (
          <p className="text-center text-muted-foreground text-sm mt-1">{item.description}</p>
        )}
      </div>

      {/* Progress bar */}
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/30 z-20">
          <div
            key={item.id + "-progress"}
            className="h-full bg-primary origin-left"
            style={{
              animation: `slideshow-progress ${SLIDE_DURATION}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              "rounded-full transition-all duration-200",
              i === index ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-foreground/30 hover:bg-foreground/60"
            )}
          />
        ))}
      </div>

      <style>{`
        @keyframes slideshow-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
