import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CallType = "voice" | "video";
export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";
type RejectReason = "busy" | "unavailable" | "declined" | "error";

export interface WebRTCSession {
  callState: CallState;
  callType: CallType;
  incomingCallType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: RejectReason) => void;
  hangUp: () => void;
  isMuted: boolean;
  isSpeaker: boolean;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  flipCamera: () => Promise<void>;
  isFrontCamera: boolean;
  callDuration: number;
  partnerOnline?: boolean;
  callError: string | null;
  clearCallError: () => void;
}

interface UseWebRTCProps {
  coupleId: string | null;
  myUserId: string | null;
  partnerUserId: string | null;
  partnerOnline?: boolean;
  enabled?: boolean;
}

interface SignalPayload {
  type: "offer" | "answer" | "ice" | "call-request" | "call-accept" | "call-reject" | "call-end";
  from: string;
  callType?: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  reason?: RejectReason;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

function getCallErrorMessage(error: unknown, action: "start" | "accept" | "media"): string {
  if (!(error instanceof Error)) {
    return action === "accept"
      ? "Could not answer the call. Please try again."
      : "Could not start the call. Please try again.";
  }

  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    return action === "accept"
      ? "Microphone or camera permission was denied. Allow access to answer the call."
      : "Microphone or camera permission was denied. Allow access to start the call.";
  }
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "No microphone or camera was found on this device.";
  }
  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "Your microphone or camera is already in use by another app.";
  }
  if (error.name === "OverconstrainedError") {
    return "This camera is not available on your device.";
  }
  if (error.name === "AbortError") {
    return "The call setup was interrupted. Please try again.";
  }
  return error.message || "Something went wrong while setting up the call.";
}

export function useWebRTC({
  coupleId,
  myUserId,
  partnerUserId,
  partnerOnline,
  enabled = true,
}: UseWebRTCProps): WebRTCSession {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("voice");
  const [incomingCallType, setIncomingCallType] = useState<CallType>("voice");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const channelReadyRef = useRef(false);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const hangUpRef = useRef<() => void>(() => {});
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callStateRef = useRef<CallState>("idle");
  const facingModeRef = useRef<"user" | "environment">("user");
  const isFlippingRef = useRef(false);

  const channelName = coupleId ? `call:${coupleId}` : null;

  const setCallStateSafe = useCallback((next: CallState) => {
    callStateRef.current = next;
    setCallState(next);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const stopDisconnectTimer = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const sendSignal = useCallback((payload: SignalPayload) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const cleanup = useCallback(() => {
    stopDurationTimer();
    stopDisconnectTimer();

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
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
  }, [stopDisconnectTimer, stopDurationTimer]);

  const startDurationTimer = useCallback(() => {
    stopDurationTimer();
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((previous) => previous + 1);
    }, 1000);
  }, [stopDurationTimer]);

  const flushPendingIce = useCallback(async (pc: RTCPeerConnection) => {
    for (const candidate of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.warn("ICE add failed:", error);
      }
    }
    pendingCandidates.current = [];
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && myUserId) {
        sendSignal({ type: "ice", from: myUserId, candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        setRemoteStream(stream);
        return;
      }
      setRemoteStream((previous) => {
        const next = previous ? new MediaStream(previous.getTracks()) : new MediaStream();
        next.addTrack(event.track);
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        stopDisconnectTimer();
        setCallError(null);
        setCallStateSafe("connected");
        startDurationTimer();
      }

      if (pc.connectionState === "disconnected") {
        stopDisconnectTimer();
        disconnectTimerRef.current = setTimeout(() => {
          if (pc.connectionState === "disconnected") {
            hangUpRef.current();
          }
        }, 8_000);
      }

      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        hangUpRef.current();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [myUserId, sendSignal, setCallStateSafe, startDurationTimer, stopDisconnectTimer]);

  const acquireMedia = useCallback(async (type: CallType) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Calling is not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: type === "video" ? { facingMode: "user" } : false,
    });

    facingModeRef.current = "user";
    setIsFrontCamera(true);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const ensureChannelReady = useCallback(async () => {
    if (channelReadyRef.current) return;

    const startedAt = Date.now();
    while (!channelReadyRef.current) {
      if (Date.now() - startedAt > 5_000) {
        throw new Error("Call signaling is not ready yet.");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, []);

  const sendCallPush = useCallback(async (type: CallType) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      await supabase.functions.invoke("send-push", {
        body: {
          title: type === "video" ? "Incoming Video Call" : "Incoming Voice Call",
          body: type === "video" ? "Incoming video call" : "Incoming voice call",
          url: "/dashboard?tab=chat",
          tag: "usmoment-incoming-call",
          requireInteraction: true,
          renotify: true,
          vibrate: [300, 150, 300, 150, 500],
        },
      });
    } catch (error) {
      console.warn("Failed to send call push:", error);
    }
  }, []);

  const startCall = useCallback(
    async (type: CallType) => {
      if (!enabled) return;

      if (!coupleId || !myUserId || !partnerUserId) {
        setCallError("A partner is required before you can place a call.");
        return;
      }

      if (callStateRef.current !== "idle") {
        setCallError("You are already in a call.");
        return;
      }

      try {
        setCallError(null);
        await ensureChannelReady();
        setCallType(type);
        setIncomingCallType(type);
        setCallStateSafe("calling");

        const stream = await acquireMedia(type);
        const pc = createPC();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        sendSignal({ type: "call-request", from: myUserId, callType: type });
        void sendCallPush(type);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", from: myUserId, sdp: offer, callType: type });
      } catch (error) {
        console.error("startCall failed:", error);
        cleanup();
        setCallStateSafe("idle");
        setCallError(getCallErrorMessage(error, "start"));
      }
    },
    [
      acquireMedia,
      cleanup,
      coupleId,
      createPC,
      enabled,
      ensureChannelReady,
      myUserId,
      partnerUserId,
      sendCallPush,
      sendSignal,
      setCallStateSafe,
    ],
  );

  const acceptCall = useCallback(async () => {
    if (!enabled || !myUserId) return;

    try {
      setCallError(null);
      const stream = await acquireMedia(incomingCallType);
      const pc = createPC();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      sendSignal({ type: "call-accept", from: myUserId, callType: incomingCallType });

      if (pendingOffer.current) {
        await pc.setRemoteDescription(pendingOffer.current);
        pendingOffer.current = null;

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: "answer", from: myUserId, sdp: answer, callType: incomingCallType });
        await flushPendingIce(pc);
      }

      setCallType(incomingCallType);
      setCallStateSafe("connected");
    } catch (error) {
      console.error("acceptCall failed:", error);
      cleanup();
      setCallStateSafe("ringing");
      setCallError(getCallErrorMessage(error, "accept"));
    }
  }, [acquireMedia, cleanup, createPC, enabled, flushPendingIce, incomingCallType, myUserId, sendSignal, setCallStateSafe]);

  const rejectCall = useCallback(
    (reason: RejectReason = "declined") => {
      if (!enabled) return;
      if (myUserId) {
        sendSignal({ type: "call-reject", from: myUserId, reason });
      }
      cleanup();
      setCallStateSafe("idle");
    },
    [cleanup, enabled, myUserId, sendSignal, setCallStateSafe],
  );

  const hangUp = useCallback(() => {
    if (!enabled) return;
    if (myUserId && callStateRef.current !== "idle") {
      sendSignal({ type: "call-end", from: myUserId });
    }
    cleanup();
    setCallStateSafe("idle");
  }, [cleanup, enabled, myUserId, sendSignal, setCallStateSafe]);

  useEffect(() => {
    hangUpRef.current = hangUp;
  }, [hangUp]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeaker((previous) => !previous);
  }, []);

  const flipCamera = useCallback(async () => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    const stream = localStreamRef.current;
    if (!stream) {
      isFlippingRef.current = false;
      return;
    }

    const oldVideoTrack = stream.getVideoTracks()[0];
    if (!oldVideoTrack) {
      isFlippingRef.current = false;
      return;
    }

    const newFacing = facingModeRef.current === "user" ? "environment" : "user";
    let newVideoTrack: MediaStreamTrack | null = null;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacing } },
        audio: false,
      });

      newVideoTrack = newStream.getVideoTracks()[0];

      const sender = pcRef.current?.getSenders().find((candidate) => candidate.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      stream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
      stream.addTrack(newVideoTrack);

      const updatedStream = new MediaStream(stream.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
      facingModeRef.current = newFacing;
      setIsFrontCamera(newFacing === "user");
    } catch (error) {
      console.warn("Camera flip failed:", error);

      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing },
          audio: false,
        });

        newVideoTrack = fallback.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find((candidate) => candidate.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        stream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        stream.addTrack(newVideoTrack);

        const updatedStream = new MediaStream(stream.getTracks());
        localStreamRef.current = updatedStream;
        setLocalStream(updatedStream);
        facingModeRef.current = newFacing;
        setIsFrontCamera(newFacing === "user");
      } catch (fallbackError) {
        console.warn("Camera flip fallback also failed:", fallbackError);
        newVideoTrack?.stop();
        setCallError("Could not switch cameras on this device.");
      }
    } finally {
      isFlippingRef.current = false;
    }
  }, []);

  const clearCallError = useCallback(() => {
    setCallError(null);
  }, []);

  useEffect(() => {
    if (!enabled || !channelName || !myUserId) return;

    channelReadyRef.current = false;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "signal" }, async ({ payload }: { payload: SignalPayload }) => {
      if (payload.from === myUserId) return;
      if (partnerUserId && payload.from !== partnerUserId) return;

      switch (payload.type) {
        case "call-request":
          if (callStateRef.current !== "idle") {
            sendSignal({ type: "call-reject", from: myUserId, reason: "busy" });
            return;
          }
          setCallError(null);
          setIncomingCallType(payload.callType ?? "voice");
          setCallType(payload.callType ?? "voice");
          setCallStateSafe("ringing");
          return;

        case "call-accept":
          setCallError(null);
          setCallStateSafe("connected");
          return;

        case "call-reject":
          cleanup();
          setCallStateSafe("idle");
          setCallError(
            payload.reason === "busy"
              ? "Your partner is already on another call."
              : payload.reason === "unavailable"
                ? "Your partner could not receive the call."
                : payload.reason === "error"
                  ? "The call could not be completed."
                  : "Your partner declined the call.",
          );
          return;

        case "call-end":
          cleanup();
          setCallStateSafe("idle");
          return;

        case "offer":
          if (!payload.sdp) return;

          if (callStateRef.current === "idle") {
            setCallType(payload.callType ?? "voice");
            setIncomingCallType(payload.callType ?? "voice");
            setCallStateSafe("ringing");
          }

          if (pcRef.current && pcRef.current.signalingState !== "closed") {
            try {
              await pcRef.current.setRemoteDescription(payload.sdp);

              if (pcRef.current.signalingState === "have-remote-offer") {
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                sendSignal({ type: "answer", from: myUserId, sdp: answer, callType: incomingCallType });
              }

              await flushPendingIce(pcRef.current);
            } catch (error) {
              console.error("Error handling offer:", error);
              rejectCall("error");
              setCallError("Could not connect this call.");
            }
          } else {
            pendingOffer.current = payload.sdp;
          }
          return;

        case "answer":
          if (!payload.sdp || !pcRef.current) return;
          try {
            await pcRef.current.setRemoteDescription(payload.sdp);
            await flushPendingIce(pcRef.current);
          } catch (error) {
            console.error("Error handling answer:", error);
            hangUp();
            setCallError("The call connection could not be completed.");
          }
          return;

        case "ice":
          if (!payload.candidate) return;

          if (pcRef.current?.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(payload.candidate);
            } catch (error) {
              console.warn("ICE add failed:", error);
            }
          } else {
            pendingCandidates.current.push(payload.candidate);
          }
          return;
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channelReadyRef.current = true;
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        channelReadyRef.current = false;
      }
    });

    channelRef.current = channel;

    return () => {
      channelReadyRef.current = false;
      cleanup();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    channelName,
    cleanup,
    enabled,
    flushPendingIce,
    hangUp,
    incomingCallType,
    myUserId,
    partnerUserId,
    rejectCall,
    sendSignal,
    setCallStateSafe,
  ]);

  return {
    callState,
    callType,
    incomingCallType,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    isMuted,
    isSpeaker,
    toggleMute,
    toggleSpeaker,
    flipCamera,
    isFrontCamera,
    callDuration,
    partnerOnline,
    callError,
    clearCallError,
  };
}
