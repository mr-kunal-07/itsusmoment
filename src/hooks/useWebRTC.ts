import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CallType = "voice" | "video";
export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface UseWebRTCProps {
  coupleId: string | null;
  myUserId: string | null;
  partnerUserId: string | null;
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
];

export function useWebRTC({ coupleId, myUserId, partnerUserId }: UseWebRTCProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("voice");
  const [incomingCallType, setIncomingCallType] = useState<CallType>("voice");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

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
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && myUserId) {
        sendSignal({ type: "ice", from: myUserId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        hangUp();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [myUserId, sendSignal]);

  const acquireMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
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

    // Build peer connection and offer
    const pc = createPC();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type: "offer", from: myUserId, sdp: offer });
  }, [coupleId, myUserId, partnerUserId, sendSignal, createPC, acquireMedia]);

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
      await pc.addIceCandidate(c);
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
            if (pcRef.current) {
              // Caller side won't normally receive an offer, but handle gracefully
              await pcRef.current.setRemoteDescription(payload.sdp);
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);
              sendSignal({ type: "answer", from: myUserId, sdp: answer });
            } else {
              // Receiver: buffer the offer until acceptCall creates the PC
              pendingOffer.current = payload.sdp;
            }
          }
          break;

        case "answer":
          if (payload.sdp && pcRef.current) {
            await pcRef.current.setRemoteDescription(payload.sdp);
          }
          break;

        case "ice":
          if (payload.candidate) {
            if (pcRef.current?.remoteDescription) {
              await pcRef.current.addIceCandidate(payload.candidate);
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
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, hangUp,
  };
}