import { useRef, useState, useEffect, useCallback, memo } from "react";
import { X, Send, Undo2, Eraser, Pencil } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "#1a1a1a", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f472b6",
] as const;

const SIZES = [2, 4, 8, 12] as const;
const HISTORY_LIMIT = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onSend: (dataUrl: string) => void;
  onClose: () => void;
}

// ─── ColorSwatch ──────────────────────────────────────────────────────────────

const ColorSwatch = memo(function ColorSwatch({
  c, selected, onSelect,
}: {
  c: string; selected: boolean; onSelect: (c: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(c)}
      aria-label={`Color ${c}`}
      aria-pressed={selected}
      className="h-7 w-7 rounded-full transition-transform shrink-0"
      style={{
        background: c,
        transform: selected ? "scale(1.25)" : "scale(1)",
        boxShadow: selected ? `0 0 0 2px hsl(var(--wa-header)), 0 0 0 4px ${c}` : "none",
      }}
    />
  );
});

// ─── DrawingCanvas ────────────────────────────────────────────────────────────

export const DrawingCanvas = memo(function DrawingCanvas({ onSend, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<string>(COLORS[0]);
  const [size, setSize] = useState<number>(SIZES[1]);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // FIX: saveState defined BEFORE the useEffect that calls it.
  // Original had saveState defined AFTER the useEffect, which relied on hoisting
  // of the useCallback — this is fragile and breaks linting/strict mode analysis.
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    setHistory(prev => [...prev.slice(-(HISTORY_LIMIT - 1)), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  // Init white canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    saveState(); // safe: saveState is defined above
  }, [saveState]);

  // ── Coordinate helper ──────────────────────────────────────────────────────
  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  // ── Draw handlers ──────────────────────────────────────────────────────────
  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, [getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);

    // FIX: eraser mode uses destination-out composite instead of painting white —
    // painting white breaks if canvas background is transparent.
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = size * 2; // eraser is wider than pen
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Restore composite after eraser stroke
    if (isEraser) ctx.globalCompositeOperation = "source-over";

    lastPos.current = pos;
  }, [isDrawing, isEraser, size, color, getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    saveState();
  }, [isDrawing, saveState]);

  // ── Undo ───────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (history.length < 2) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
  }, [history]);

  // ── Clear ──────────────────────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [saveState]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // FIX: fill white behind transparent pixels before export so PNG looks correct
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    onSend(offscreen.toDataURL("image/png"));
  }, [onSend]);

  const activeDrawColor = isEraser ? "#aaaaaa" : color;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col"
      style={{ background: "hsl(var(--background))" }}
      role="dialog"
      aria-modal="true"
      aria-label="Drawing canvas"
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0"
        style={{ background: "hsl(var(--wa-header))" }}
      >
        <button onClick={onClose} className="p-2 rounded-full" style={{ color: "hsl(var(--wa-text))" }} aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <span className="text-sm font-semibold" style={{ color: "hsl(var(--wa-text))" }}>
          ✏️ Draw &amp; Send
        </span>

        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={history.length < 2} className="p-2 rounded-full disabled:opacity-30" style={{ color: "hsl(var(--wa-text) / 0.6)" }} aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </button>
          {/* FIX: eraser is now a proper toggle button, not just clearCanvas */}
          <button
            onClick={() => setIsEraser(e => !e)}
            className="p-2 rounded-full transition-colors"
            style={{
              color: isEraser ? "hsl(var(--wa-online))" : "hsl(var(--wa-text) / 0.6)",
              background: isEraser ? "hsl(var(--wa-online) / 0.12)" : "transparent",
            }}
            aria-label="Eraser"
            aria-pressed={isEraser}
          >
            <Eraser className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsEraser(false)}
            className="p-2 rounded-full transition-colors"
            style={{
              color: !isEraser ? "hsl(var(--wa-online))" : "hsl(var(--wa-text) / 0.6)",
              background: !isEraser ? "hsl(var(--wa-online) / 0.12)" : "transparent",
            }}
            aria-label="Pen"
            aria-pressed={!isEraser}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={clearCanvas} className="p-2 rounded-full text-xs font-medium" style={{ color: "hsl(var(--wa-text) / 0.6)" }} aria-label="Clear canvas">
            Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{ cursor: isEraser ? "cell" : "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          aria-label="Drawing surface"
        />
      </div>

      {/* Bottom toolbar */}
      <div
        className="shrink-0 border-t border-border px-3 py-3"
        style={{
          background: "hsl(var(--wa-header))",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Color palette */}
        <div className="flex items-center gap-2 mb-3" role="group" aria-label="Color palette">
          {COLORS.map(c => (
            <ColorSwatch key={c} c={c} selected={!isEraser && color === c} onSelect={(c) => { setColor(c); setIsEraser(false); }} />
          ))}
        </div>

        {/* Sizes + Send */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3" role="group" aria-label="Brush size">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-label={`Size ${s}`}
                aria-pressed={size === s}
                className="flex items-center justify-center h-8 w-8 rounded-full transition-colors"
                style={{ background: size === s ? "hsl(var(--wa-text) / 0.1)" : "transparent" }}
              >
                <span
                  className="rounded-full"
                  style={{ width: s + 4, height: s + 4, background: activeDrawColor }}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          <button
            onClick={handleSend}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ background: "hsl(var(--wa-online))" }}
            aria-label="Send drawing"
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default DrawingCanvas;