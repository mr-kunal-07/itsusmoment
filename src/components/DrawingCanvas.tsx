import { useRef, useState, useEffect, useCallback } from "react";
import { X, Send, Undo2, Eraser } from "lucide-react";

const COLORS = [
  "#1a1a1a", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f472b6",
];

const SIZES = [2, 4, 8, 12];

interface Props {
  onSend: (dataUrl: string) => void;
  onClose: () => void;
}

export function DrawingCanvas({ onSend, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize white canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    saveState();
  }, []);

  const saveState = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    setHistory(prev => [...prev.slice(-20), ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)]);
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      saveState();
    }
  };

  const undo = () => {
    if (history.length < 2) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSend(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0" style={{ background: "hsl(var(--wa-header))" }}>
        <button onClick={onClose} className="p-2 rounded-full" style={{ color: "hsl(var(--wa-text))" }}>
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold" style={{ color: "hsl(var(--wa-text))" }}>✏️ Draw & Send</span>
        <div className="flex items-center gap-2">
          <button onClick={undo} className="p-2 rounded-full" style={{ color: "hsl(var(--wa-text) / 0.6)" }} title="Undo">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={clearCanvas} className="p-2 rounded-full" style={{ color: "hsl(var(--wa-text) / 0.6)" }} title="Clear">
            <Eraser className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="shrink-0 border-t border-border px-3 py-3" style={{ background: "hsl(var(--wa-header))", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
        {/* Colors */}
        <div className="flex items-center gap-2 mb-3">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full transition-transform shrink-0"
              style={{
                background: c,
                transform: color === c ? "scale(1.25)" : "scale(1)",
                boxShadow: color === c ? `0 0 0 2px hsl(var(--wa-header)), 0 0 0 4px ${c}` : "none",
              }}
            />
          ))}
        </div>

        {/* Sizes + Send */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className="flex items-center justify-center h-8 w-8 rounded-full transition-colors"
                style={{ background: size === s ? "hsl(var(--wa-text) / 0.1)" : "transparent" }}
              >
                <span
                  className="rounded-full"
                  style={{ width: s + 4, height: s + 4, background: color }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={handleSend}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ background: "hsl(var(--wa-online))" }}
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
