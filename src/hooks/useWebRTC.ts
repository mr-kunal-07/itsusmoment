import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CallType = "voice" | "video";
export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface UseWebRTCProps {
  coupleId: string | null;
  myUserId: string | null;
  partnerUserId: string | null;
  partnerOnline?: boolean;
}

interface SignalPayload {
  type: "offer" | "answer" | "ice" | "call-request" | "call-accept" | "call-reject" | "call-end";
  from: string;
  callType?: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function useWebRTC({ coupleId, myUserId, partnerUserId, partnerOnline }: UseWebRTCProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("voice");
  const [incomingCallType, setIncomingCallType] = useState<CallType>("voice");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const hangUpRef = useRef<() => void>(() => {});
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const channelName = coupleId ? `call:${coupleId}` : null;

  // ── helpers ──────────────────────────────────────────────

  const sendSignal = useCallback((payload: SignalPayload) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pendingCandidates.current = [];
    pendingOffer.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsSpeaker(false);
    setCallDuration(0);
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    durationTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && myUserId) {
        sendSignal({ type: "ice", from: myUserId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
      } else {
        // Fallback: create a new stream from the track
        const stream = new MediaStream([e.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        startDurationTimer();
      }
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        hangUpRef.current();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [myUserId, sendSignal, startDurationTimer]);

  const acquireMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: type === "video" ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ── send push notification for call ─────────────────────
  const sendCallPush = useCallback(async (type: CallType) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.functions.invoke("send-push", {
        body: {
          title: "Incoming Call",
          body: type === "video" ? "📹 Incoming video call" : "📞 Incoming voice call",
          url: "/dashboard?tab=chat",
        },
      });
    } catch (e) {
      console.warn("Failed to send call push:", e);
    }
  }, []);

  // ── public actions ──────────────────────────────────────

  const startCall = useCallback(async (type: CallType) => {
    if (!coupleId || !myUserId || !partnerUserId) return;
    setCallType(type);
    setCallState("calling");

    // Acquire media FIRST (must be in click handler for Safari)
    const stream = await acquireMedia(type);

    // Signal partner
    sendSignal({ type: "call-request", from: myUserId, callType: type });

    // Send push notification so partner gets notified even if app is in background
    sendCallPush(type);

    // Build peer connection and offer
    const pc = createPC();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type: "offer", from: myUserId, sdp: offer });
  }, [coupleId, myUserId, partnerUserId, sendSignal, createPC, acquireMedia, sendCallPush]);

  const acceptCall = useCallback(async () => {
    if (!myUserId) return;

    // Acquire media (must be in click handler for Safari)
    const stream = await acquireMedia(incomingCallType);

    setCallState("connected");
    setCallType(incomingCallType);
    sendSignal({ type: "call-accept", from: myUserId });

    // Create peer connection
    const pc = createPC();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Apply buffered offer
    if (pendingOffer.current) {
      await pc.setRemoteDescription(pendingOffer.current);
      pendingOffer.current = null;

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ type: "answer", from: myUserId, sdp: answer });
    }

    // Flush buffered ICE candidates
    for (const c of pendingCandidates.current) {
      try { await pc.addIceCandidate(c); } catch (e) { console.warn("ICE add failed:", e); }
    }
    pendingCandidates.current = [];
  }, [myUserId, incomingCallType, sendSignal, createPC, acquireMedia]);

  const rejectCall = useCallback(() => {
    if (!myUserId) return;
    sendSignal({ type: "call-reject", from: myUserId });
    cleanup();
    setCallState("idle");
  }, [myUserId, sendSignal, cleanup]);

  const hangUp = useCallback(() => {
    if (myUserId) sendSignal({ type: "call-end", from: myUserId });
    cleanup();
    setCallState("idle");
  }, [myUserId, sendSignal, cleanup]);

  // Keep hangUpRef in sync
  useEffect(() => { hangUpRef.current = hangUp; }, [hangUp]);

  // ── mute / speaker toggles ─────────────────────────────

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeaker(prev => !prev);
    // On mobile, try to switch audio output if supported
    const remoteAudio = document.querySelector("video[data-remote-audio]") as HTMLMediaElement | null;
    if (remoteAudio && "setSinkId" in remoteAudio) {
      // Toggle between default and speaker (best-effort)
      (remoteAudio as any).setSinkId?.("").catch(() => {});
    }
  }, []);

  // ── signaling channel ───────────────────────────────────

  useEffect(() => {
    if (!channelName || !myUserId) return;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "signal" }, async ({ payload }: { payload: SignalPayload }) => {
      if (payload.from === myUserId) return;

      switch (payload.type) {
        case "call-request":
          setIncomingCallType(payload.callType ?? "voice");
          setCallState("ringing");
          break;

        case "call-accept":
          setCallState("connected");
          break;

        case "call-reject":
        case "call-end":
          cleanup();
          setCallState("idle");
          break;

        case "offer":
          if (payload.sdp) {
            if (pcRef.current && pcRef.current.signalingState !== "closed") {
              try {
                await pcRef.current.setRemoteDescription(payload.sdp);
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                sendSignal({ type: "answer", from: myUserId, sdp: answer });

                // Flush any buffered ICE candidates now that remote description is set
                for (const c of pendingCandidates.current) {
                  try { await pcRef.current.addIceCandidate(c); } catch (e) { console.warn("ICE flush:", e); }
                }
                pendingCandidates.current = [];
              } catch (e) {
                console.error("Error handling offer:", e);
              }
            } else {
              // Receiver: buffer the offer until acceptCall creates the PC
              pendingOffer.current = payload.sdp;
            }
          }
          break;

        case "answer":
          if (payload.sdp && pcRef.current) {
            try {
              await pcRef.current.setRemoteDescription(payload.sdp);
              // Flush any buffered ICE candidates
              for (const c of pendingCandidates.current) {
                try { await pcRef.current.addIceCandidate(c); } catch (e) { console.warn("ICE flush:", e); }
              }
              pendingCandidates.current = [];
            } catch (e) {
              console.error("Error handling answer:", e);
            }
          }
          break;

        case "ice":
          if (payload.candidate) {
            if (pcRef.current?.remoteDescription) {
              try { await pcRef.current.addIceCandidate(payload.candidate); } catch (e) { console.warn("ICE add:", e); }
            } else {
              pendingCandidates.current.push(payload.candidate);
            }
          }
          break;
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, myUserId, sendSignal, cleanup]);

  return {
    callState, callType, incomingCallType,
    localStream, remoteStream,
    startCall, acceptCall, rejectCall, hangUp,
    isMuted, isSpeaker, toggleMute, toggleSpeaker,
    callDuration, partnerOnline,
  };
}
