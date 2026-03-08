import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onSend: (audioUrl: string, duration: string) => void;
  onCancel: () => void;
  disabled?: boolean;
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

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
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
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const filePath = `${user!.id}/${crypto.randomUUID()}.webm`;
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

  useEffect(() => {
    startRecording();
    return cleanup;
  }, []);

  return (
    <div className="flex items-center gap-2 flex-1 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-2">
      {/* Animated dot */}
      <span className={cn("h-2.5 w-2.5 rounded-full bg-destructive shrink-0", isRecording && "animate-pulse")} />
      <span className="text-sm font-mono text-destructive font-medium tabular-nums">
        {isPending ? "Sending…" : formatTime(seconds)}
      </span>
      <span className="text-xs text-muted-foreground flex-1">{isRecording ? "Recording…" : ""}</span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
        onClick={cancel}
        disabled={isPending}
      >
        <X className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="icon"
        className="h-8 w-8 rounded-full shrink-0 bg-destructive hover:bg-destructive/90"
        onClick={stopAndSend}
        disabled={isPending || seconds === 0}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-3.5 w-3.5 fill-white" />}
      </Button>
    </div>
  );
}

/** Inline button to trigger voice recording */
export function MicButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full shrink-0 text-muted-foreground hover:text-primary"
      onClick={onClick}
      disabled={disabled}
      title="Record voice message"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
