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

export function useWebRTC({ coupleId, myUserId, partnerUserId }: UseWebRTCProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("voice");
  const [incomingCallType, setIncomingCallType] = useState<CallType>("voice");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const channelName = coupleId ? `call:${coupleId}` : null;

  const sendSignal = useCallback((payload: SignalPayload) => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const createPeerConnection = useCallback((type: CallType) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && myUserId) {
        sendSignal({ type: "ice", from: myUserId, candidate: e.candidate.toJSON() });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        hangUp();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [myUserId, sendSignal]);

  const getMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (type: CallType) => {
    if (!coupleId || !myUserId || !partnerUserId) return;
    setCallType(type);
    setCallState("calling");

    sendSignal({ type: "call-request", from: myUserId, callType: type });

    const pc = createPeerConnection(type);
    const stream = await getMedia(type);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type: "offer", from: myUserId, sdp: offer });
  }, [coupleId, myUserId, partnerUserId, sendSignal, createPeerConnection, getMedia]);

  const acceptCall = useCallback(async () => {
    if (!myUserId) return;
    setCallState("connected");
    sendSignal({ type: "call-accept", from: myUserId });

    const pc = createPeerConnection(incomingCallType);
    const stream = await getMedia(incomingCallType);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Add pending candidates
    for (const c of pendingCandidates.current) await pc.addIceCandidate(c);
    pendingCandidates.current = [];
  }, [myUserId, incomingCallType, sendSignal, createPeerConnection, getMedia]);

  const rejectCall = useCallback(() => {
    if (!myUserId) return;
    sendSignal({ type: "call-reject", from: myUserId });
    setCallState("idle");
  }, [myUserId, sendSignal]);

  const hangUp = useCallback(() => {
    if (myUserId) sendSignal({ type: "call-end", from: myUserId });

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
  }, [myUserId, sendSignal]);

  // Supabase Realtime signaling channel
  useEffect(() => {
    if (!channelName || !myUserId) return;

    const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } });

    channel.on("broadcast", { event: "signal" }, async ({ payload }: { payload: SignalPayload }) => {
      if (payload.from === myUserId) return; // ignore own signals

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
          pcRef.current?.close();
          pcRef.current = null;
          localStreamRef.current?.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
          setLocalStream(null);
          setRemoteStream(null);
          setCallState("idle");
          break;

        case "offer":
          if (payload.sdp && pcRef.current) {
            await pcRef.current.setRemoteDescription(payload.sdp);
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            sendSignal({ type: "answer", from: myUserId, sdp: answer });
            // flush pending candidates
            for (const c of pendingCandidates.current) await pcRef.current.addIceCandidate(c);
            pendingCandidates.current = [];
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
  }, [channelName, myUserId, sendSignal]);

  return {
    callState, callType, incomingCallType,
    localStream, remoteStream,
    localVideoRef, remoteVideoRef,
    startCall, acceptCall, rejectCall, hangUp,
  };
}
