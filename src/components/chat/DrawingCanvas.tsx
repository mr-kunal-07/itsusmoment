// src/components/chat/DrawingCanvas.tsx

import { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  X, Send, Undo2, Redo2, Eraser, Pencil,
  Minus, Square, Circle, Type, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLORS, BG_COLORS, SIZES, TOOL_KEYS,
  type Tool,
} from "./canvas/canvas.constants";
import {
  normalizeRect, floodFill, setupHiDpiCanvas,
  downloadCanvas, clampTextPos, snapshotCanvas,
  restoreSnapshot,
} from "./canvas/canvas.utils";
import { useCanvasHistory } from "./canvas/useCanvasHistory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onSend: (dataUrl: string) => void;
  onClose: () => void;
}

// ─── ColorSwatch ──────────────────────────────────────────────────────────────

const ColorSwatch = memo(function ColorSwatch({
  c, selected, onSelect, size = "md",
}: {
  c: string; selected: boolean; onSelect: (c: string) => void; size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  // FIX: minimum 44px tap target on mobile per Apple HIG
  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      aria-label={`Color ${c}`}
      aria-pressed={selected}
      className={cn(
        dim, "rounded-full transition-transform shrink-0 border border-black/10",
        "min-h-[44px] min-w-[44px] flex items-center justify-center",
      )}
      style={{
        background: "transparent",
      }}
    >
      <span
        className={cn(dim, "rounded-full block")}
        style={{
          background: c,
          transform: selected ? "scale(1.3)" : "scale(1)",
          boxShadow: selected ? `0 0 0 2px hsl(var(--wa-header)), 0 0 0 4px ${c}` : "none",
          transition: "transform 0.1s, box-shadow 0.1s",
        }}
      />
    </button>
  );
});

// ─── TOOLS config — memoized outside component so it's stable ────────────────

const TOOLS: { id: Tool; label: string; key: string }[] = [
  { id: "pen", label: "Pen", key: "P" },
  { id: "eraser", label: "Eraser", key: "E" },
  { id: "line", label: "Line", key: "L" },
  { id: "rect", label: "Rect", key: "R" },
  { id: "circle", label: "Circle", key: "C" },
  { id: "text", label: "Text", key: "T" },
  { id: "fill", label: "Fill", key: "F" },
];

const TOOL_ICONS: Record<Tool, React.ReactNode> = {
  pen: <Pencil className="h-4 w-4" />,
  eraser: <Eraser className="h-4 w-4" />,
  line: <Minus className="h-4 w-4" />,
  rect: <Square className="h-4 w-4" />,
  circle: <Circle className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  fill: <span style={{ fontSize: 14, lineHeight: 1 }}>🪣</span>,
};

// ─── DrawingCanvas ────────────────────────────────────────────────────────────

export const DrawingCanvas = memo(function DrawingCanvas({ onSend, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const ratioRef = useRef<number>(1); // FIX 14: store dpr ratio

  // FIX: store draw config in refs so draw() callback never recreates
  const colorRef = useRef<string>(COLORS[0]);
  const sizeRef = useRef<number>(SIZES[1]);
  const opacityRef = useRef<number>(100);
  const toolRef = useRef<Tool>("pen");
  const bgColorRef = useRef<string>(BG_COLORS[0]);

  // State only for UI re-renders — not for draw logic
  const [color, setColor] = useState<string>(COLORS[0]);
  const [bgColor, setBgColor] = useState<string>(BG_COLORS[0]);
  const [size, setSize] = useState<number>(SIZES[1]);
  const [tool, setTool] = useState<Tool>("pen");
  const [opacity, setOpacity] = useState<number>(100);
  const [fontSize, setFontSize] = useState<number>(24);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showText, setShowText] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState("");

  // Sync refs with state
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { opacityRef.current = opacity; }, [opacity]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { bgColorRef.current = bgColor; }, [bgColor]);

  // History
  const { history, redoStack, saveState, undo, redo, canUndo, canRedo } =
    useCanvasHistory(canvasRef);

  // ── FIX 14: Setup HiDPI canvas ───────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!canvas || !overlay || !container) return;

    const { clientWidth: displayW, clientHeight: displayH } = container;
    if (displayW === 0 || displayH === 0) return;

    // Snapshot current content before resize
    let snapshot: string | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try { snapshot = snapshotCanvas(canvas); } catch { /* ignore */ }
    }

    // FIX 14: HiDPI setup — physical pixels scaled by devicePixelRatio
    const { ratio } = setupHiDpiCanvas(canvas, displayW, displayH);
    ratioRef.current = ratio;

    // Overlay same size, no scaling needed (it's just a preview layer)
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.width = canvas.style.width;
    overlay.style.height = canvas.style.height;

    // Fill background
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = bgColorRef.current;
      ctx.fillRect(0, 0, displayW, displayH); // draw in CSS pixels (ctx is scaled)
    }

    // Restore previous content
    if (snapshot && ctx) {
      restoreSnapshot(ctx, snapshot, displayW, displayH);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    resizeCanvas();
    saveState();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeCanvas]);

  // ── FIX 6: Pointer events (unifies mouse + touch + stylus) ──────────────
  // FIX 5: Multi-touch guard — ignore if more than one pointer
  const getPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const activePointerId = useRef<number | null>(null);

  // FIX 2: requestAnimationFrame for pen drawing
  const rafRef = useRef<number | null>(null);
  const pendingPos = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // FIX 5: reject secondary pointers (multi-touch)
    if (activePointerId.current !== null && e.pointerId !== activePointerId.current) return;
    activePointerId.current = e.pointerId;
    ; (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const pos = getPos(e);
    const currentTool = toolRef.current;

    if (currentTool === "text") {
      const container = containerRef.current;
      const clamped = clampTextPos(
        pos.x, pos.y,
        container?.clientWidth ?? 400,
        container?.clientHeight ?? 600,
      );
      setTextPos(clamped);
      setTextValue("");
      setShowText(true);
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    if (currentTool === "fill") {
      const canvas = canvasRef.current;
      if (canvas) {
        floodFill(canvas, pos.x * ratioRef.current, pos.y * ratioRef.current, colorRef.current);
        saveState();
      }
      return;
    }

    setIsDrawing(true);
    startPos.current = pos;

    if (currentTool === "pen" || currentTool === "eraser") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        // FIX 10: eraser always full opacity
        ctx.globalAlpha = currentTool === "eraser" ? 1 : opacityRef.current / 100;
        if (currentTool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "rgba(0,0,0,1)";
          ctx.lineWidth = sizeRef.current * 2;
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = colorRef.current;
          ctx.lineWidth = sizeRef.current;
          // FIX: pressure sensitivity for stylus
          if (e.pointerType === "pen" && e.pressure > 0) {
            ctx.lineWidth = sizeRef.current * (0.5 + e.pressure);
          }
        }
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    }
  }, [getPos, saveState]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || e.pointerId !== activePointerId.current) return;

    const currentTool = toolRef.current;

    if (currentTool === "pen" || currentTool === "eraser") {
      // FIX: use requestAnimationFrame to throttle draw calls
      pendingPos.current = getPos(e);
      if (rafRef.current) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pos = pendingPos.current;
        if (!pos) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        // Pressure sensitivity
        if (e.pointerType === "pen" && e.pressure > 0 && toolRef.current !== "eraser") {
          ctx.lineWidth = sizeRef.current * (0.5 + e.pressure);
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      });
      return;
    }

    // Shape preview on overlay
    const overlay = overlayRef.current;
    const octx = overlay?.getContext("2d");
    if (!octx || !overlay || !startPos.current) return;

    const pos = getPos(e);
    octx.clearRect(0, 0, overlay.width, overlay.height);
    octx.globalAlpha = opacityRef.current / 100;
    octx.strokeStyle = colorRef.current;
    octx.lineWidth = sizeRef.current;
    octx.lineCap = "round";

    const { x: sx, y: sy } = startPos.current;
    const { x: ex, y: ey } = pos;

    if (currentTool === "line") {
      octx.beginPath();
      octx.moveTo(sx, sy);
      octx.lineTo(ex, ey);
      octx.stroke();
    } else if (currentTool === "rect") {
      // FIX 2: normalized rect — works in all drag directions
      const { x, y, w, h } = normalizeRect(sx, sy, ex, ey);
      octx.strokeRect(x, y, w, h);
    } else if (currentTool === "circle") {
      // FIX 2: normalized ellipse
      const { x, y, w, h } = normalizeRect(sx, sy, ex, ey);
      octx.beginPath();
      octx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      octx.stroke();
    }
  }, [isDrawing, getPos]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    activePointerId.current = null;
    if (!isDrawing) return;
    setIsDrawing(false);

    const currentTool = toolRef.current;

    if (currentTool === "pen" || currentTool === "eraser") {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      saveState();
      return;
    }

    // Commit shape from overlay to main canvas
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    const octx = overlay?.getContext("2d");
    if (!canvas || !overlay || !ctx || !octx) return;

    ctx.globalAlpha = opacityRef.current / 100;
    ctx.drawImage(overlay, 0, 0,
      overlay.width / ratioRef.current, overlay.height / ratioRef.current,
    );
    ctx.globalAlpha = 1;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    saveState();
    startPos.current = null;
  }, [isDrawing, saveState]);

  // ── FIX 12: Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack shortcuts when typing in text input
      if (document.activeElement === textInputRef.current) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }

      const mapped = TOOL_KEYS[e.key.toLowerCase()];
      if (mapped) setTool(mapped);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Commit text ────────────────────────────────────────────────────────────
  const commitText = useCallback(() => {
    if (!textValue.trim()) { setShowText(false); return; }
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalAlpha = opacityRef.current / 100;
    ctx.fillStyle = colorRef.current;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(textValue, textPos.x, textPos.y);
    ctx.globalAlpha = 1;
    setShowText(false);
    setTextValue("");
    saveState();
  }, [textValue, textPos, fontSize, saveState]);

  // ── Clear ──────────────────────────────────────────────────────────────────
  // FIX 9: saveState() called AFTER fillRect, not before — consistent undo
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bgColorRef.current;
    const container = containerRef.current;
    ctx.fillRect(0, 0, container?.clientWidth ?? canvas.width, container?.clientHeight ?? canvas.height);
    saveState(); // after clear — so undo brings back the drawing
  }, [saveState]);

  // ── Download ───────────────────────────────────────────────────────────────
  // FIX 11: Safari-safe download
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvas(canvas, `drawing-${Date.now()}.png`);
  }, []);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = containerRef.current;
    const displayW = container?.clientWidth ?? 800;
    const displayH = container?.clientHeight ?? 600;

    const offscreen = document.createElement("canvas");
    offscreen.width = displayW;
    offscreen.height = displayH;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = bgColorRef.current;
    ctx.fillRect(0, 0, displayW, displayH);
    // Draw scaled down from physical pixels
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, displayW, displayH);
    onSend(offscreen.toDataURL("image/png"));
  }, [onSend]);

  // FIX: memoize tool buttons so they don't recreate on every color change
  const toolButtons = useMemo(() => TOOLS.map(t => (
    <button
      key={t.id}
      type="button"
      onClick={() => setTool(t.id)}
      aria-label={`${t.label} (${t.key})`}
      aria-pressed={tool === t.id}
      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[36px]"
      style={{
        background: tool === t.id ? "hsl(var(--wa-online) / 0.15)" : "transparent",
        color: tool === t.id ? "hsl(var(--wa-online))" : "hsl(var(--wa-text) / 0.6)",
      }}
    >
      {TOOL_ICONS[t.id]}
      <span className="hidden sm:inline">{t.label}</span>
    </button>
  )), [tool]);

  // FIX 7: proper cursor per tool
  const canvasCursor =
    tool === "eraser" ? "crosshair" :
      tool === "text" ? "text" :
        tool === "fill" ? "cell" : "crosshair";

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col"
      // FIX 3 responsive: use dvh so mobile keyboard doesn't break layout
      style={{ background: "hsl(var(--background))", height: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Drawing canvas"
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0"
        style={{ background: "hsl(var(--wa-header))", paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <button type="button" onClick={onClose} className="p-2 rounded-full" style={{ color: "hsl(var(--wa-text))" }} aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold" style={{ color: "hsl(var(--wa-text))" }}>
          ✏️ Draw &amp; Send
        </span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={undo} disabled={!canUndo} className="p-2 rounded-full disabled:opacity-30" style={{ color: "hsl(var(--wa-text) / 0.6)" }} aria-label="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="p-2 rounded-full disabled:opacity-30" style={{ color: "hsl(var(--wa-text) / 0.6)" }} aria-label="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleDownload} className="p-2 rounded-full" style={{ color: "hsl(var(--wa-text) / 0.6)" }} aria-label="Download">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" onClick={clearCanvas} className="px-2 py-1 rounded-lg text-xs font-medium" style={{ color: "hsl(var(--wa-text) / 0.6)" }}>
            Clear
          </button>
        </div>
      </div>

      {/* ── Tool bar ── */}
      <div
        className="flex items-center gap-0.5 px-2 py-1 border-b border-border shrink-0 overflow-x-auto"
        style={{ background: "hsl(var(--wa-header))" }}
      >
        {toolButtons}
      </div>

      {/* ── Canvas area ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ background: bgColor, touchAction: "none" }}
      >
        {/* Main canvas — FIX 14: HiDPI, FIX 6: pointer events */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: canvasCursor, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Drawing surface"
        />
        {/* Shape preview overlay */}
        <canvas
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        />

        {/* FIX 8: Clamped text input so it never overflows screen */}
        {showText && (
          <div
            className="absolute z-10 flex items-center gap-1"
            style={{ left: textPos.x, top: textPos.y - fontSize - 4 }}
          >
            <input
              ref={textInputRef}
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") commitText();
                if (e.key === "Escape") setShowText(false);
              }}
              className="border border-border rounded px-2 py-1 bg-white text-black outline-none shadow-lg"
              style={{ fontSize, minWidth: 120, maxWidth: 220 }}
              placeholder="Type here…"
            />
            <button type="button" onClick={commitText} className="px-2 py-1 rounded text-xs font-semibold text-white" style={{ background: "hsl(var(--wa-online))" }}>OK</button>
            <button type="button" onClick={() => setShowText(false)} className="px-2 py-1 rounded text-xs text-white" style={{ background: "hsl(var(--wa-text) / 0.3)" }}>✕</button>
          </div>
        )}
      </div>

      {/* ── Bottom toolbar ── */}
      <div
        className="shrink-0 border-t border-border px-3 pt-2 pb-3"
        style={{
          background: "hsl(var(--wa-header))",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Row 1: Draw colors */}
        <div className="flex items-center gap-0.5 mb-1 overflow-x-auto" role="group" aria-label="Color palette">
          {COLORS.map(c => (
            <ColorSwatch
              key={c} c={c}
              selected={tool !== "eraser" && color === c}
              onSelect={c => { setColor(c); if (tool === "eraser") setTool("pen"); }}
            />
          ))}
          {/* Native color picker for custom color */}
          <label className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" aria-label="Custom color">
            <span className="h-7 w-7 rounded-full border-2 border-dashed border-border flex items-center justify-center text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>+</span>
            <input
              type="color"
              className="sr-only"
              value={color}
              onChange={e => { setColor(e.target.value); if (tool === "eraser") setTool("pen"); }}
            />
          </label>
        </div>

        {/* Row 2: Size + Opacity + BG + Font size + Send */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Brush sizes */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Brush size">
            {SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-label={`Size ${s}`}
                aria-pressed={size === s}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors"
                style={{ background: size === s ? "hsl(var(--wa-text) / 0.12)" : "transparent" }}
              >
                <span
                  className="rounded-full block"
                  style={{ width: s + 2, height: s + 2, background: tool === "eraser" ? "#aaa" : color }}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
            <span className="text-[10px] shrink-0" style={{ color: "hsl(var(--wa-meta))" }}>{opacity}%</span>
            <input
              type="range" min={10} max={100} step={10}
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              className="w-full h-1 rounded-full"
              aria-label="Opacity"
              style={{ accentColor: "hsl(var(--wa-online))" }}
            />
          </div>

          {/* Font size — only when text tool active */}
          {tool === "text" && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] shrink-0" style={{ color: "hsl(var(--wa-meta))" }}>Aa {fontSize}px</span>
              <input
                type="range" min={12} max={64} step={4}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-20 h-1 rounded-full"
                aria-label="Font size"
                style={{ accentColor: "hsl(var(--wa-online))" }}
              />
            </div>
          )}

          {/* Background colors */}
          <div className="flex items-center gap-0.5" role="group" aria-label="Background color">
            {BG_COLORS.map(c => (
              <ColorSwatch key={c} c={c} selected={bgColor === c} onSelect={setBgColor} size="sm" />
            ))}
          </div>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0 ml-auto"
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