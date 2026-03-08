import { useState, useEffect, useCallback, useRef } from "react";
import { Media, getPublicUrl } from "@/hooks/useMedia";
import { Play, X, ChevronLeft, ChevronRight, Pause, Music, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  media: Media[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
}

const SLIDE_DURATION = 4000;

function getMusicEmbed(url: string): { type: "youtube" | "spotify"; embedUrl: string } | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&loop=1&playlist=${ytMatch[1]}&controls=0&modestbranding=1&rel=0`,
    };
  }
  // Spotify track/playlist/album
  const spMatch = url.match(/open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  if (spMatch) {
    return {
      type: "spotify",
      embedUrl: `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?autoplay=1`,
    };
  }
  return null;
}

export function Slideshow({ media, startIndex = 0, open, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const [fade, setFade] = useState(true);
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [activeMusic, setActiveMusic] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const embed = activeMusic ? getMusicEmbed(activeMusic) : null;

  const handleMusicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveMusic(musicUrl.trim());
    setShowMusicInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110"
        style={{ backgroundImage: `url(${getPublicUrl(item.file_path)})` }}
      />

      {/* Hidden music iframe */}
      {embed && (
        <iframe
          key={embed.embedUrl}
          src={embed.embedUrl}
          allow="autoplay; encrypted-media"
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          title="background music"
        />
      )}

      {/* Controls top-right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Music button */}
        <div className="relative">
          <button
            onClick={() => { setShowMusicInput(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
            className={cn(
              "h-9 w-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
              activeMusic
                ? "bg-primary/30 text-primary border border-primary/40 animate-pulse"
                : "bg-background/20 hover:bg-background/40 text-foreground"
            )}
            title={activeMusic ? "Music playing" : "Add background music"}
          >
            <Music className="h-4 w-4" />
          </button>

          {showMusicInput && (
            <form
              onSubmit={handleMusicSubmit}
              className="absolute top-11 right-0 bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl w-72 z-20"
            >
              <p className="text-xs font-medium mb-2">🎵 Background Music</p>
              <p className="text-[10px] text-muted-foreground mb-2">Paste a YouTube or Spotify link</p>
              <input
                ref={inputRef}
                type="url"
                value={musicUrl}
                onChange={e => setMusicUrl(e.target.value)}
                placeholder="https://youtu.be/... or spotify.com/..."
                className="w-full text-xs bg-muted rounded-lg px-3 py-2 outline-none border border-border focus:border-primary transition-colors"
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground text-xs rounded-lg py-1.5 font-medium hover:bg-primary/90">
                  Play
                </button>
                {activeMusic && (
                  <button
                    type="button"
                    onClick={() => { setActiveMusic(""); setMusicUrl(""); setShowMusicInput(false); }}
                    className="flex-1 bg-muted text-muted-foreground text-xs rounded-lg py-1.5 font-medium hover:bg-destructive/10 hover:text-destructive"
                  >
                    Stop
                  </button>
                )}
                <button type="button" onClick={() => setShowMusicInput(false)} className="bg-muted text-muted-foreground text-xs rounded-lg px-3 py-1.5">
                  ✕
                </button>
              </div>
              {embed && (
                <a href={activeMusic} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary mt-2 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Open in {embed.type === "youtube" ? "YouTube" : "Spotify"}
                </a>
              )}
            </form>
          )}
        </div>

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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <span className="text-xs font-medium bg-background/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-foreground/80">
          {index + 1} / {images.length}
        </span>
        {activeMusic && (
          <span className="text-xs font-medium bg-primary/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-primary flex items-center gap-1.5">
            <Music className="h-3 w-3 animate-pulse" /> Music on
          </span>
        )}
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
            style={{ animation: `slideshow-progress ${SLIDE_DURATION}ms linear forwards` }}
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
