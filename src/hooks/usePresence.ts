import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PresencePayload = { userId: string; ts: number };

export function usePresence(
  coupleId: string | null | undefined,
  currentUserId: string | null | undefined,
  partnerId: string | null | undefined
) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    if (!coupleId || !currentUserId) return;

    // ✅ Type the channel generic so presenceState() knows your payload shape
    const channel = supabase.channel(`presence:${coupleId}`, {
      config: { presence: { key: currentUserId } },
    });

    const isPartner = (p: unknown): p is PresencePayload =>
      typeof p === "object" && p !== null && (p as PresencePayload).userId === partnerId;

    const getPartnerPresence = (): PresencePayload | null => {
      const state = channel.presenceState();
      for (const presences of Object.values(state)) {
        // ✅ Cast through unknown — Supabase merges your tracked fields into
        // the Presence wrapper at runtime, but the type doesn't reflect that
        const match = (presences as unknown as PresencePayload[]).find(isPartner);
        if (match) return match;
      }
      return null;
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const partner = getPartnerPresence();
        setPartnerOnline(!!partner);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const joining = (newPresences as unknown as PresencePayload[]).find(isPartner);
        if (joining) setPartnerOnline(true);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const leaving = (leftPresences as unknown as PresencePayload[]).find(isPartner);
        if (leaving) {
          setPartnerOnline(false);
          // ✅ Use their tracked ts, not Date.now()
          setPartnerLastSeen(leaving.ts ? new Date(leaving.ts) : new Date());
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: currentUserId, ts: Date.now() });
          // Catch the case where partner was already online before we subscribed
          const partner = getPartnerPresence();
          if (partner) setPartnerOnline(true);
        }
      });

    return () => {
      channel.untrack().then(() => supabase.removeChannel(channel));
    };
  }, [coupleId, currentUserId, partnerId]);

  return { partnerOnline, partnerLastSeen };
}