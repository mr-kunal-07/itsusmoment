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
}: Props) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // ── Stream attachment ──────────────────────────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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