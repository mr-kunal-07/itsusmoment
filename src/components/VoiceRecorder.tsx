import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, X, Mic, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onSend: (audioUrl: string, duration: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const MAX_SECONDS = 120;

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Animated waveform bars */
function Waveform({ isRecording }: { isRecording: boolean }) {
  const BARS = 28;
  return (
    <div className="flex items-center gap-[2px] h-8">
      {Array.from({ length: BARS }).map((_, i) => (
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
}

export function VoiceRecorder({ onSend, onCancel, disabled }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const cleanup = useCallback(() => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Try webm/opus first, fall back to whatever the browser supports
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s + 1 >= MAX_SECONDS) {
          // Auto-stop at max
          clearInterval(timerRef.current!);
        }
        return s + 1;
      }), 1000);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
      onCancel();
    }
  }, [toast, onCancel]);

  const stopAndSend = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    const duration = formatTime(seconds);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPending(true);
    stopTimer();

    await new Promise<void>(resolve => {
      mediaRecorderRef.current!.onstop = () => resolve();
    });

    try {
      const ext = chunksRef.current[0]?.type.includes("mp4") ? "mp4" : "webm";
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
  }, [isRecording, seconds, user, onSend, onCancel, cleanup, toast]);

  const cancel = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    stopTimer();
    cleanup();
    onCancel();
  }, [cleanup, onCancel]);

  // Auto-send when hitting MAX_SECONDS
  useEffect(() => {
    if (seconds >= MAX_SECONDS && isRecording) {
      stopAndSend();
    }
  }, [seconds, isRecording, stopAndSend]);

  useEffect(() => {
    startRecording();
    return cleanup;
  }, []);

  const progress = Math.min(100, (seconds / MAX_SECONDS) * 100);

  return (
    <div
      className="flex items-center gap-3 flex-1 rounded-3xl px-4 py-2.5 relative overflow-hidden"
      style={{ background: "hsl(var(--wa-input-bg))" }}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 opacity-20 transition-all duration-1000 ease-linear rounded-3xl"
        style={{
          background: `linear-gradient(90deg, hsl(var(--wa-online)) ${progress}%, transparent ${progress}%)`,
        }}
      />

      {/* Cancel */}
      <button
        type="button"
        onClick={cancel}
        disabled={isPending}
        className="shrink-0 text-white/40 hover:text-red-400 transition-colors z-10"
        title="Cancel"
      >
        <Trash2 className="h-5 w-5" />
      </button>

      {/* Waveform + timer */}
      <div className="flex-1 flex items-center gap-3 min-w-0 z-10">
        {isPending ? (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "hsl(var(--wa-online))" }} />
            <span>Sending…</span>
          </div>
        ) : (
          <>
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
              style={{ background: "hsl(var(--wa-online))" }}
            />
            <span
              className="text-sm font-mono font-semibold tabular-nums shrink-0"
              style={{ color: "hsl(var(--wa-online))" }}
            >
              {formatTime(seconds)}
            </span>
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
        disabled={isPending || seconds < 1}
        className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 z-10"
        style={{ background: "hsl(var(--wa-online))" }}
        title="Send"
      >
        <Send className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}

/** Inline button to trigger voice recording */
export function MicButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 text-white/40 hover:text-white/70 transition-colors mb-0.5"
      title="Record voice message"
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
