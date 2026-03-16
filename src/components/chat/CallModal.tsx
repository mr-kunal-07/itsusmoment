import { useEffect, useRef, memo } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2, Volume1, SwitchCamera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CallState, CallType } from "@/hooks/useWebRTC";
import { playRingtone, playDialingTone, stopCallSound } from "@/lib/callSounds";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  callState: CallState;
  callType: CallType;
  incomingCallType: CallType;
  partnerName: string;
  partnerAvatarUrl?: string;
  partnerInitials: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  callDuration: number;
  partnerOnline?: boolean;
  onFlipCamera?: () => void;
  /** Whether the local camera is currently front-facing — used to mirror the PiP */
  isFrontCamera?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ─── CallButton ───────────────────────────────────────────────────────────────

const CallButton = memo(function CallButton({
  onClick, label, bg, size = "lg", children,
}: {
  onClick: () => void;
  label: string;
  bg: string;
  size?: "sm" | "lg";
  children: React.ReactNode;
}) {
  const dim = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        aria-label={label}
        className={`${dim} rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg`}
        style={{ background: bg }}
      >
        {children}
      </button>
      <span className="text-xs text-white/70">{label}</span>
    </div>
  );
});

// ─── CallModal ────────────────────────────────────────────────────────────────

export const CallModal = memo(function CallModal({
  callState, callType, incomingCallType,
  partnerName, partnerAvatarUrl, partnerInitials,
  localStream, remoteStream,
  onAccept, onReject, onHangUp,
  isMuted, isSpeaker, onToggleMute, onToggleSpeaker,
  callDuration, partnerOnline, onFlipCamera,
  isFrontCamera = true,
}: Props) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // AudioContext refs for iOS speaker routing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // ── Remote video attachment ────────────────────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── Local video attachment (re-fires on every flip) ────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ── Remote audio + speaker routing ────────────────────────────────────────
  //
  // Two strategies, tried in order:
  //
  // Strategy A — setSinkId (Chrome desktop + Android Chrome):
  //   Pass the string ID of the speaker/earpiece output device.
  //   "communications" device = OS-selected call device (earpiece on mobile).
  //   Specific device ID from enumerateDevices() = loudspeaker.
  //
  // Strategy B — AudioContext (iOS Safari + fallback):
  //   <audio> element playing a MediaStream → iOS routes to earpiece/receiver.
  //   AudioContext.createMediaStreamSource → iOS routes to loudspeaker.
  //   We toggle between the two based on isSpeaker.
  //
  // On every remoteStream change we also re-apply the current routing so a
  // late-arriving stream (partner joins after us) is routed correctly.
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !remoteStream) return;

    const applyRouting = async () => {
      // ── Teardown any existing AudioContext routing ────────────────────────
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
      if (audioCtxRef.current) {
        await audioCtxRef.current.close().catch(() => { });
        audioCtxRef.current = null;
      }

      if (isSpeaker) {
        // ── SPEAKER (loudspeaker) mode ──────────────────────────────────────

        // Strategy A: setSinkId — try to find a "speaker" output device
        if ("setSinkId" in audioEl) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const speakerDevice = devices.find(
              d => d.kind === "audiooutput" &&
                /speaker|loud/i.test(d.label)
            );
            // If no labelled speaker found, empty string = default output
            // which on most desktop/Android = loudspeaker
            await (audioEl as any).setSinkId(speakerDevice?.deviceId ?? "");
            audioEl.srcObject = remoteStream;
            audioEl.muted = false;
            return; // setSinkId worked — done
          } catch {
            // setSinkId failed (iOS, Firefox) — fall through to AudioContext
          }
        }

        // Strategy B: AudioContext → loudspeaker on iOS
        try {
          // Mute the audio element first so we don't get double audio
          audioEl.muted = true;
          audioEl.srcObject = remoteStream;

          const ctx = new AudioContext();
          audioCtxRef.current = ctx;
          if (ctx.state === "suspended") await ctx.resume();

          const source = ctx.createMediaStreamSource(remoteStream);
          sourceNodeRef.current = source;
          source.connect(ctx.destination);
        } catch (e) {
          // AudioContext also failed — last resort: unmute audio element
          console.warn("Speaker routing via AudioContext failed:", e);
          audioEl.muted = false;
          audioEl.srcObject = remoteStream;
        }

      } else {
        // ── EARPIECE mode (default call audio) ─────────────────────────────

        // Strategy A: setSinkId to "communications" device = OS call route
        // (earpiece on mobile, default headset/speaker on desktop)
        if ("setSinkId" in audioEl) {
          try {
            await (audioEl as any).setSinkId("communications");
            audioEl.srcObject = remoteStream;
            audioEl.muted = false;
            return;
          } catch {
            // "communications" not supported — try empty string (default device)
            try {
              await (audioEl as any).setSinkId("");
              audioEl.srcObject = remoteStream;
              audioEl.muted = false;
              return;
            } catch {
              // Fall through to Strategy B
            }
          }
        }

        // Strategy B: plain <audio> element → iOS routes to earpiece by default
        audioEl.muted = false;
        audioEl.srcObject = remoteStream;
      }
    };

    applyRouting();

    return () => {
      // Cleanup AudioContext on unmount / stream change
      sourceNodeRef.current?.disconnect();
      sourceNodeRef.current = null;
      audioCtxRef.current?.close().catch(() => { });
      audioCtxRef.current = null;
    };
  }, [remoteStream, isSpeaker]);

  // ── Call sounds ────────────────────────────────────────────────────────────
  // FIX: single unified effect — no duplicate stopCallSound() calls from multiple effects.
  // FIX: early-return was placed AFTER hooks in the original — hooks must run unconditionally.
  useEffect(() => {
    if (callState === "ringing") playRingtone();
    else if (callState === "calling") playDialingTone();
    else stopCallSound();
    return () => stopCallSound();
  }, [callState]);

  // FIX: early return moved AFTER all hooks — React rules of hooks forbid
  // returning before hooks are called. Original had `if (callState === "idle") return null`
  // before the audio element (which is below the return null line) causing
  // the audio ref to never attach properly.
  if (callState === "idle") return null;

  const isVideo = callState === "ringing" ? incomingCallType === "video" : callType === "video";
  const isConnected = callState === "connected";
  const isCalling = callState === "calling";
  const isRinging = callState === "ringing";

  const statusText = (() => {
    if (isCalling) {
      return partnerOnline === false
        ? (isVideo ? "📹 Partner offline — calling…" : "📞 Partner offline — calling…")
        : (isVideo ? "📹 Ringing…" : "📞 Ringing…");
    }
    if (isRinging) return incomingCallType === "video" ? "📹 Incoming video call" : "📞 Incoming voice call";
    if (isConnected) return isVideo ? `📹 ${formatDuration(callDuration)}` : `📞 ${formatDuration(callDuration)}`;
    return "";
  })();

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "hsl(var(--background))" }}
      role="dialog"
      aria-modal="true"
      aria-label={`${isVideo ? "Video" : "Voice"} call with ${partnerName}`}
    >
      {/* Hidden audio element — always rendered so ref is always valid */}
      <audio ref={remoteAudioRef} autoPlay aria-hidden />

      {/* Remote video (connected video call) */}
      {isVideo && isConnected && remoteStream && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.85)" }}
          aria-hidden
        />
      )}

      {/* Dark overlay */}
      {(!isVideo || !isConnected) && (
        <div className="absolute inset-0" style={{ background: "hsl(0 0% 7%)" }} aria-hidden />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-16 px-6">

        {/* Partner info */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`relative ${isRinging ? "animate-pulse" : ""}`}>
            <Avatar className="h-24 w-24 ring-4 ring-border">
              <AvatarImage src={partnerAvatarUrl} />
              <AvatarFallback
                className="text-2xl font-bold"
                style={{ background: "hsl(var(--wa-avatar))", color: "hsl(var(--wa-text))" }}
              >
                {partnerInitials}
              </AvatarFallback>
            </Avatar>

            {partnerOnline !== undefined && (
              <span
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2"
                style={{
                  borderColor: "hsl(0 0% 7%)",
                  background: partnerOnline ? "hsl(142 71% 45%)" : "hsl(0 0% 50%)",
                }}
                aria-label={partnerOnline ? "Online" : "Offline"}
              />
            )}
          </div>

          <div>
            <p className="text-2xl font-bold text-white font-heading">{partnerName}</p>
            <p className="text-sm mt-1" style={{ color: "hsl(0 0% 65%)" }} aria-live="polite">
              {statusText}
            </p>
            {isConnected && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" aria-hidden />
                <span className="text-xs text-green-400 font-medium">Connected</span>
              </div>
            )}
            {isCalling && partnerOnline === false && (
              <p className="text-xs mt-2" style={{ color: "hsl(45 100% 60%)" }}>
                Partner may not see the call right now
              </p>
            )}
          </div>
        </div>

        {/* Local video PiP */}
        {isVideo && isConnected && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            aria-hidden
            className="absolute top-4 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-border shadow-2xl"
            style={{
              // Mirror when front camera (natural selfie view).
              // No mirror for rear camera (shows scene as-is).
              transform: isFrontCamera ? "scaleX(-1)" : "none",
            }}
          />
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6">
          {isRinging ? (
            <>
              <CallButton onClick={onReject} label="Decline" bg="hsl(var(--destructive))" size="lg">
                <PhoneOff className="h-7 w-7 text-white" />
              </CallButton>
              <CallButton onClick={onAccept} label="Accept" bg="hsl(var(--wa-online))" size="lg">
                {incomingCallType === "video"
                  ? <Video className="h-7 w-7 text-white" />
                  : <Phone className="h-7 w-7 text-white" />}
              </CallButton>
            </>
          ) : (
            <>
              <CallButton
                onClick={onToggleMute}
                label={isMuted ? "Unmute" : "Mute"}
                bg={isMuted ? "hsl(0 0% 95%)" : "hsl(0 0% 20%)"}
                size="sm"
              >
                {isMuted
                  ? <MicOff className="h-6 w-6" style={{ color: "hsl(0 0% 10%)" }} />
                  : <Mic className="h-6 w-6 text-white" />}
              </CallButton>

              <CallButton
                onClick={onToggleSpeaker}
                label={isSpeaker ? "Earpiece" : "Speaker"}
                bg={isSpeaker ? "hsl(0 0% 95%)" : "hsl(0 0% 20%)"}
                size="sm"
              >
                {isSpeaker
                  ? <Volume2 className="h-6 w-6" style={{ color: "hsl(0 0% 10%)" }} />
                  : <Volume1 className="h-6 w-6 text-white" />}
              </CallButton>

              <CallButton onClick={onHangUp} label="End" bg="hsl(var(--destructive))" size="lg">
                <PhoneOff className="h-7 w-7 text-white" />
              </CallButton>

              {isVideo && onFlipCamera && (
                <CallButton onClick={onFlipCamera} label="Flip" bg="hsl(0 0% 20%)" size="sm">
                  <SwitchCamera className="h-6 w-6 text-white" />
                </CallButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default CallModal;