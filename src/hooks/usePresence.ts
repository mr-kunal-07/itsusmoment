import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracks real-time online/offline presence for the current user and their partner.
 * Uses Supabase Realtime Presence on a shared couple channel.
 */
export function usePresence(
  coupleId: string | null | undefined,
  currentUserId: string | null | undefined,
  partnerId: string | null | undefined
) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    if (!coupleId || !currentUserId) return;

    const channel = supabase.channel(`presence:${coupleId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ userId: string; ts: number }>();
        const isOnline = Object.values(state).some((presences) =>
          presences.some((p) => p.userId === partnerId)
        );
        setPartnerOnline(isOnline);
        if (!isOnline) setPartnerLastSeen(new Date());
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        if (newPresences.some((p: any) => p.userId === partnerId)) {
          setPartnerOnline(true);
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        if (leftPresences.some((p: any) => p.userId === partnerId)) {
          setPartnerOnline(false);
          setPartnerLastSeen(new Date());
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: currentUserId, ts: Date.now() });
        }
      });

    return () => {
      channel.untrack().then(() => supabase.removeChannel(channel));
    };
  }, [coupleId, currentUserId, partnerId]);

  return { partnerOnline, partnerLastSeen };
}
