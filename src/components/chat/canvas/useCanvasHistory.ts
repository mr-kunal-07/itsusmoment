// src/components/chat/canvas/useCanvasHistory.ts

import { useState, useCallback } from "react";
import { HISTORY_LIMIT } from "./canvas.constants";
import { snapshotCanvas, restoreSnapshot } from "./canvas.utils";

// FIX 1: History stores compressed dataURL strings, not heavy ImageData objects.
// Each compressed webp snapshot ≈ 30-80KB vs 4.8MB for raw ImageData.

export function useCanvasHistory(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [history,   setHistory]   = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = snapshotCanvas(canvas);
    setHistory(prev => [...prev.slice(-(HISTORY_LIMIT - 1)), snap]);
    setRedoStack([]); // new action always clears redo
  }, [canvasRef]);

  const undo = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx || history.length < 2) return;

    const newHistory = history.slice(0, -1);
    const snapshot   = newHistory[newHistory.length - 1];

    setRedoStack(prev => [history[history.length - 1], ...prev]);
    setHistory(newHistory);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await restoreSnapshot(ctx, snapshot, canvas.width, canvas.height);
  }, [history, canvasRef]);

  const redo = useCallback(async () => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    if (!canvas || !ctx || !redoStack.length) return;

    const [next, ...rest] = redoStack;

    setHistory(prev => [...prev, next]);
    setRedoStack(rest);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    await restoreSnapshot(ctx, next, canvas.width, canvas.height);
  }, [redoStack, canvasRef]);

  return {
    history,
    redoStack,
    saveState,
    undo,
    redo,
    canUndo: history.length >= 2,
    canRedo: redoStack.length > 0,
  };
}
