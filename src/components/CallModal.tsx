import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2, Volume1 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CallState, CallType } from "@/hooks/useWebRTC";
import { playRingtone, playDialingTone, stopCallSound } from "@/lib/callSounds";

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
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function CallModal({
  callState, callType, incomingCallType,
  partnerName, partnerAvatarUrl, partnerInitials,
  localStream, remoteStream,
  onAccept, onReject, onHangUp,
  isMuted, isSpeaker, onToggleMute, onToggleSpeaker,
  callDuration, partnerOnline,
}: Props) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Always attach remote stream to an audio element for voice calls
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

  if (callState === "idle") return null;

  const isVideo = callState === "ringing" ? incomingCallType === "video" : callType === "video";
  const isConnected = callState === "connected";
  const isCalling = callState === "calling";
  const isRinging = callState === "ringing";

  // Status text with network awareness
  const getStatusText = () => {
    if (isCalling) {
      if (partnerOnline === false) {
        return isVideo ? "📹 Partner offline — calling…" : "📞 Partner offline — calling…";
      }
      return isVideo ? "📹 Ringing…" : "📞 Ringing…";
    }
    if (isRinging) {
      return incomingCallType === "video" ? "📹 Incoming video call" : "📞 Incoming voice call";
    }
    if (isConnected) {
      return isVideo ? `📹 ${formatDuration(callDuration)}` : `📞 ${formatDuration(callDuration)}`;
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Hidden audio element for voice calls - ensures audio always plays */}
      <audio ref={remoteAudioRef} autoPlay data-remote-audio />

      {/* Video background (if video call and connected) */}
      {isVideo && isConnected && remoteStream && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.85)" }}
        />
      )}

      {/* Dark overlay for non-video or ringing state */}
      {(!isVideo || !isConnected) && (
        <div className="absolute inset-0" style={{ background: "hsl(0 0% 7%)" }} />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between py-16 px-6">

        {/* Top: partner info */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Pulsing ring for ringing state */}
          <div className={`relative ${isRinging ? "animate-pulse" : ""}`}>
            <Avatar className="h-24 w-24 ring-4 ring-border">
              <AvatarImage src={partnerAvatarUrl} />
              <AvatarFallback className="text-2xl font-bold" style={{ background: "hsl(var(--wa-avatar))", color: "hsl(var(--wa-text))" }}>
                {partnerInitials}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            {partnerOnline !== undefined && (
              <span
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2"
                style={{
                  borderColor: "hsl(0 0% 7%)",
                  background: partnerOnline ? "hsl(142 71% 45%)" : "hsl(0 0% 50%)",
                }}
              />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-white font-heading">{partnerName}</p>
            <p className="text-sm mt-1" style={{ color: "hsl(0 0% 65%)" }}>
              {getStatusText()}
            </p>
            {isConnected && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
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

        {/* Local video pip (video call, connected) */}
        {isVideo && isConnected && localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-border shadow-2xl"
          />
        )}

        {/* Bottom: action buttons */}
        <div className="flex items-center justify-center gap-6">
          {isRinging ? (
            <>
              {/* Reject */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onReject}
                  className="h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg"
                  style={{ background: "hsl(var(--destructive))" }}
                >
                  <PhoneOff className="h-7 w-7 text-white" />
                </button>
                <span className="text-xs text-white/70">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onAccept}
                  className="h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg animate-pulse"
                  style={{ background: "hsl(var(--wa-online))" }}
                >
                  {incomingCallType === "video"
                    ? <Video className="h-7 w-7 text-white" />
                    : <Phone className="h-7 w-7 text-white" />}
                </button>
                <span className="text-xs text-white/70">Accept</span>
              </div>
            </>
          ) : (
            <>
              {/* Mute toggle */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onToggleMute}
                  className="h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: isMuted ? "hsl(0 0% 95%)" : "hsl(0 0% 20%)" }}
                >
                  {isMuted
                    ? <MicOff className="h-6 w-6" style={{ color: "hsl(0 0% 10%)" }} />
                    : <Mic className="h-6 w-6 text-white" />}
                </button>
                <span className="text-xs text-white/60">{isMuted ? "Unmute" : "Mute"}</span>
              </div>

              {/* Speaker toggle */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onToggleSpeaker}
                  className="h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: isSpeaker ? "hsl(0 0% 95%)" : "hsl(0 0% 20%)" }}
                >
                  {isSpeaker
                    ? <Volume2 className="h-6 w-6" style={{ color: "hsl(0 0% 10%)" }} />
                    : <Volume1 className="h-6 w-6 text-white" />}
                </button>
                <span className="text-xs text-white/60">{isSpeaker ? "Earpiece" : "Speaker"}</span>
              </div>

              {/* End call */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={onHangUp}
                  className="h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg"
                  style={{ background: "hsl(var(--destructive))" }}
                >
                  <PhoneOff className="h-7 w-7 text-white" />
                </button>
                <span className="text-xs text-white/70">End</span>
              </div>

              {/* Camera toggle (video only) */}
              {isVideo && (
                <div className="flex flex-col items-center gap-2">
                  <button
                    className="h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                    style={{ background: "hsl(0 0% 20%)" }}
                  >
                    <Video className="h-6 w-6 text-white" />
                  </button>
                  <span className="text-xs text-white/60">Camera</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
