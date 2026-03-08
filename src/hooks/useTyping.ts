import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTyping(coupleId: string | null | undefined, currentUserId: string | null | undefined) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!coupleId || !currentUserId) return;

    const channel = supabase
      .channel(`typing:${coupleId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === currentUserId) return;
        setPartnerTyping(true);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => setPartnerTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [coupleId, currentUserId]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    // Throttle to once per 1.5 s to avoid spam
    if (now - lastSentRef.current < 1500) return;
    lastSentRef.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }, [currentUserId]);

  return { partnerTyping, sendTyping };
}
