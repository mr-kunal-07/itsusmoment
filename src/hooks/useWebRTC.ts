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
  // FIX 4: export isFrontCamera so CallModal can mirror the PiP correctly
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const hangUpRef = useRef<() => void>(() => { });
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // FIX 1: track facing mode in a ref — never rely on getSettings().facingMode
  // which returns undefined on most Android browsers and Firefox.
  const facingModeRef = useRef<"user" | "environment">("user");

  // FIX 3: guard against concurrent flip calls (double-tap)
  const isFlippingRef = useRef(false);

  const channelName = coupleId ? `call:${coupleId}` : null;

  // ── helpers ───────────────────────────────────────────────────────────────

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
    facingModeRef.current = "user";
    isFlippingRef.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsSpeaker(false);
    setCallDuration(0);
    setIsFrontCamera(true);
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
      if (e.streams?.[0]) {
        setRemoteStream(e.streams[0]);
      } else {
        setRemoteStream(new MediaStream([e.track]));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") startDurationTimer();
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
    // Always start with front camera
    facingModeRef.current = "user";
    setIsFrontCamera(true);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ── push notification ─────────────────────────────────────────────────────

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

  // ── public actions ────────────────────────────────────────────────────────

  const startCall = useCallback(async (type: CallType) => {
    if (!coupleId || !myUserId || !partnerUserId) return;
    setCallType(type);
    setCallState("calling");

    const stream = await acquireMedia(type);
    sendSignal({ type: "call-request", from: myUserId, callType: type });
    sendCallPush(type);

    const pc = createPC();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type: "offer", from: myUserId, sdp: offer });
  }, [coupleId, myUserId, partnerUserId, sendSignal, createPC, acquireMedia, sendCallPush]);

  const acceptCall = useCallback(async () => {
    if (!myUserId) return;

    const stream = await acquireMedia(incomingCallType);
    setCallState("connected");
    setCallType(incomingCallType);
    sendSignal({ type: "call-accept", from: myUserId });

    const pc = createPC();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    if (pendingOffer.current) {
      await pc.setRemoteDescription(pendingOffer.current);
      pendingOffer.current = null;
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ type: "answer", from: myUserId, sdp: answer });
    }

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

  useEffect(() => { hangUpRef.current = hangUp; }, [hangUp]);

  // ── mute / speaker ────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    // FIX 2: always read from localStreamRef — it's the authoritative stream ref.
    // After a flip, state stream and ref stream share the same track objects
    // so this correctly enables/disables audio on whatever is live.
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    // Audio routing (earpiece ↔ loudspeaker) is handled in CallModal via
    // the isSpeaker prop — it has direct access to the <audio> ref and
    // applies setSinkId / AudioContext routing there.
    // This function only toggles the state that drives that effect.
    setIsSpeaker(prev => !prev);
  }, []);

  // ── flip camera ───────────────────────────────────────────────────────────

  const flipCamera = useCallback(async () => {
    // FIX 3: guard against concurrent flips (double-tap)
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    const stream = localStreamRef.current;
    if (!stream) { isFlippingRef.current = false; return; }

    const oldVideoTrack = stream.getVideoTracks()[0];
    if (!oldVideoTrack) { isFlippingRef.current = false; return; }

    // FIX 1: use our own ref — never trust getSettings().facingMode
    const newFacing: "user" | "environment" =
      facingModeRef.current === "user" ? "environment" : "user";

    let newVideoTrack: MediaStreamTrack | null = null;

    try {
      // Acquire just the new video track
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacing } },
        audio: false,
      });
      newVideoTrack = newStream.getVideoTracks()[0];

      // 1. Replace on the RTCPeerConnection sender FIRST — this is what the
      //    remote side sees. Must happen before we touch the local stream.
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // 2. Stop the old video track AFTER the sender swap — stopping it before
      //    replaceTrack can cause the remote side to see a black frame or freeze.
      stream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();

      // 3. Add the new track to the existing stream
      stream.addTrack(newVideoTrack);

      // FIX 2: update localStreamRef to a new MediaStream so CallModal's
      // useEffect re-fires and re-attaches the updated stream to the video element.
      // We wrap in new MediaStream so the reference changes — same tracks as localStreamRef.
      const updatedStream = new MediaStream(stream.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);

      // FIX 1: persist the new facing mode in our ref + state
      facingModeRef.current = newFacing;
      setIsFrontCamera(newFacing === "user");

    } catch (e) {
      console.warn("Camera flip failed:", e);
      // If { exact: newFacing } fails (some devices don't support it),
      // fall back without the exact constraint
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing },
          audio: false,
        });
        newVideoTrack = fallback.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(newVideoTrack);
        stream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        stream.addTrack(newVideoTrack);
        const updatedStream = new MediaStream(stream.getTracks());
        localStreamRef.current = updatedStream;
        setLocalStream(updatedStream);
        facingModeRef.current = newFacing;
        setIsFrontCamera(newFacing === "user");
      } catch (fallbackErr) {
        console.warn("Camera flip fallback also failed:", fallbackErr);
        // FIX 5: clean up the new track if we couldn't use it
        newVideoTrack?.stop();
      }
    } finally {
      isFlippingRef.current = false;
    }
  }, []);

  // ── signaling channel ─────────────────────────────────────────────────────

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
                for (const c of pendingCandidates.current) {
                  try { await pcRef.current.addIceCandidate(c); } catch (e) { console.warn("ICE flush:", e); }
                }
                pendingCandidates.current = [];
              } catch (e) {
                console.error("Error handling offer:", e);
              }
            } else {
              pendingOffer.current = payload.sdp;
            }
          }
          break;

        case "answer":
          if (payload.sdp && pcRef.current) {
            try {
              await pcRef.current.setRemoteDescription(payload.sdp);
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
    flipCamera, isFrontCamera,
    callDuration, partnerOnline,
  };
}