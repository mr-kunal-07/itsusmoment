import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CallState, CallType } from "@/hooks/useWebRTC";

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
}

export function CallModal({
  callState, callType, incomingCallType,
  partnerName, partnerAvatarUrl, partnerInitials,
  localStream, remoteStream,
  onAccept, onReject, onHangUp,
}: Props) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "hsl(var(--background))" }}>
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
          <Avatar className="h-24 w-24 ring-4 ring-border">
            <AvatarImage src={partnerAvatarUrl} />
            <AvatarFallback className="text-2xl font-bold" style={{ background: "hsl(var(--wa-avatar))", color: "hsl(var(--wa-text))" }}>
              {partnerInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-2xl font-bold text-white font-heading">{partnerName}</p>
            <p className="text-sm mt-1" style={{ color: "hsl(0 0% 65%)" }}>
              {isCalling ? (isVideo ? "📹 Video calling…" : "📞 Voice calling…") :
               isRinging ? (incomingCallType === "video" ? "📹 Incoming video call" : "📞 Incoming voice call") :
               isConnected ? (isVideo ? "📹 Video call" : "📞 Voice call") : ""}
            </p>
            {isConnected && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Connected</span>
              </div>
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
        <div className="flex items-center justify-center gap-8">
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
              {/* Mute (visual only for now) */}
              <div className="flex flex-col items-center gap-2">
                <button
                  className="h-14 w-14 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{ background: "hsl(0 0% 20%)" }}
                >
                  <Mic className="h-6 w-6 text-white" />
                </button>
                <span className="text-xs text-white/60">Mute</span>
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
