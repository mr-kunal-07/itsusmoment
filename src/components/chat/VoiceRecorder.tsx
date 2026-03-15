import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Loader2, Mic, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SECONDS = 120;
const WAVEFORM_BARS = 28;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function detectMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? "";
}

// ─── Waveform ─────────────────────────────────────────────────────────────────
// Defined outside component — no props that change on every render

const Waveform = memo(function Waveform({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-8" aria-hidden>
      {Array.from({ length: WAVEFORM_BARS }).map((_, i) => (
        <span
          key={i}
          className="rounded-full w-[3px] shrink-0"
          style={{
            background: "hsl(var(--wa-online))",
            height: isRecording ? undefined : "4px",
            animation: isRecording
              ? `waveBar 0.9s ease-in-out ${(i * 60) % 700}ms infinite alternate`
              : "none",
            minHeight: 4,
          }}
        />
      ))}
    </div>
  );
});

// ─── VoiceRecorder ────────────────────────────────────────────────────────────

interface Props {
  onSend: (audioUrl: string, duration: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const VoiceRecorder = memo(function VoiceRecorder({ onSend, onCancel, disabled }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Cleanup helper ─────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = detectMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);

      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
      onCancel();
    }
  }, [toast, onCancel]);

  // ── Stop + upload + send ───────────────────────────────────────────────────
  // FIX: `seconds` was in the dep array causing a new function reference every
  // second, which triggered the auto-send useEffect on every tick.
  // Use a ref to read current seconds at send time instead.
  const secondsRef = useRef(seconds);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  const stopAndSend = useCallback(async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    const duration = formatTime(secondsRef.current);
    mr.stop();
    setIsRecording(false);
    setIsPending(true);
    if (timerRef.current) clearInterval(timerRef.current);

    await new Promise<void>(resolve => { mr.onstop = () => resolve(); });

    try {
      const firstChunk = chunksRef.current[0];
      const ext = firstChunk?.type.includes("mp4") ? "mp4"
        : firstChunk?.type.includes("ogg") ? "ogg"
          : "webm";
      const blob = new Blob(chunksRef.current, { type: `audio/${ext}` });
      const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("audio").upload(filePath, blob);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("audio").getPublicUrl(filePath);
      onSend(data.publicUrl, duration);
    } catch (err: any) {
      toast({ title: "Failed to send voice message", description: err.message, variant: "destructive" });
      onCancel();
    } finally {
      cleanup();
      setIsPending(false);
    }
  }, [user, onSend, onCancel, cleanup, toast]);

  // ── Cancel ────────────────────────────────────────────────────────────────
  const cancel = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  // ── Auto-send at MAX_SECONDS ───────────────────────────────────────────────
  // FIX: was previously triggered every second because stopAndSend was in the
  // deps and re-created each tick. Now stable.
  useEffect(() => {
    if (seconds >= MAX_SECONDS && isRecording) stopAndSend();
  }, [seconds, isRecording, stopAndSend]);

  // ── Start on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    startRecording();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = Math.min(100, (seconds / MAX_SECONDS) * 100);
  const timeLeft = MAX_SECONDS - seconds;

  return (
    <div
      className="flex items-center gap-3 flex-1 rounded-3xl px-4 py-2.5 relative overflow-hidden"
      style={{ background: "hsl(var(--wa-input-bg))" }}
      role="status"
      aria-label={`Recording: ${formatTime(seconds)}`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 opacity-20 rounded-3xl"
        style={{
          background: `linear-gradient(90deg, hsl(var(--wa-online)) ${progress}%, transparent ${progress}%)`,
          transition: "background 1s linear",
        }}
        aria-hidden
      />

      {/* Cancel */}
      <button
        type="button"
        onClick={cancel}
        disabled={isPending}
        className="shrink-0 text-white/40 hover:text-red-400 transition-colors z-10"
        aria-label="Cancel recording"
      >
        <Trash2 className="h-5 w-5" />
      </button>

      {/* Waveform + timer */}
      <div className="flex-1 flex items-center gap-3 min-w-0 z-10">
        {isPending ? (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "hsl(var(--wa-online))" }} aria-hidden />
            <span>Sending…</span>
          </div>
        ) : (
          <>
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
              style={{ background: "hsl(var(--wa-online))" }}
              aria-hidden
            />
            <span
              className="text-sm font-mono font-semibold tabular-nums shrink-0"
              style={{ color: "hsl(var(--wa-online))" }}
              aria-live="off"
            >
              {formatTime(seconds)}
            </span>
            {/* FIX: show time remaining when near limit */}
            {timeLeft <= 15 && (
              <span className="text-[10px] font-medium shrink-0" style={{ color: "hsl(var(--destructive))" }}>
                {timeLeft}s left
              </span>
            )}
            <div className="flex-1 overflow-hidden">
              <Waveform isRecording={isRecording} />
            </div>
          </>
        )}
      </div>

      {/* Send */}
      <button
        type="button"
        onClick={stopAndSend}
        disabled={isPending || seconds < 1 || disabled}
        className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 z-10"
        style={{ background: "hsl(var(--wa-online))" }}
        aria-label="Send voice message"
      >
        <Send className="h-4 w-4 text-white" />
      </button>
    </div>
  );
});

// ─── MicButton ────────────────────────────────────────────────────────────────

export const MicButton = memo(function MicButton({
  onClick, disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 text-white/40 hover:text-white/70 transition-colors mb-0.5"
      aria-label="Record voice message"
    >
      <Mic className="h-5 w-5" />
    </button>
  );
});

export default VoiceRecorder;