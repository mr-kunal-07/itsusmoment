import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const HEARTBEAT_MS = 30_000;          // write last_seen_at every 30 s
const ONLINE_THRESHOLD_MS = 70_000;          // 70 s = 2× heartbeat + buffer
const ONLINE_CHECK_MS = 15_000;          // re-evaluate online state every 15 s

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UsePresenceReturn {
    partnerOnline: boolean;
    partnerLastSeen: Date | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePresence(
    coupleId: string | null,
    myUserId: string | null | undefined,
    partnerId: string | null | undefined,
): UsePresenceReturn {
    const [partnerLastSeen, _setPartnerLastSeen] = useState<Date | null>(null);
    const [partnerOnline, setPartnerOnline] = useState(false);

    // ── KEY FIX: module-level ref stays in sync with state ──────────────────
    // Any code that needs the latest partnerLastSeen synchronously (intervals,
    // event handlers) reads from this ref instead of the stale closure value.
    const partnerLastSeenRef = useRef<Date | null>(null);

    // Single setter that keeps both state and ref in sync at all times.
    const updatePartnerLastSeen = useCallback((date: Date) => {
        partnerLastSeenRef.current = date;
        _setPartnerLastSeen(date);
    }, []);

    // Stable refs for IDs — avoids effect re-runs when parent re-renders
    const myUserIdRef = useRef(myUserId);
    const partnerIdRef = useRef(partnerId);
    useEffect(() => { myUserIdRef.current = myUserId; }, [myUserId]);
    useEffect(() => { partnerIdRef.current = partnerId; }, [partnerId]);

    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ── Write my own presence to DB ──────────────────────────────────────────
    const ping = useCallback(async () => {
        const uid = myUserIdRef.current;
        if (!uid) return;
        await supabase
            .from("profiles" as never)
            .update({ last_seen_at: new Date().toISOString() } as never)
            .eq("user_id", uid);
    }, []);

    // ── Compute partnerOnline from a Date (or the live ref) ──────────────────
    const computeOnline = useCallback((date: Date | null): boolean => {
        if (!date) return false;
        return Date.now() - date.getTime() < ONLINE_THRESHOLD_MS;
    }, []);

    // ── Apply a new partner timestamp to both pieces of state ────────────────
    const applyPartnerDate = useCallback((date: Date) => {
        updatePartnerLastSeen(date);
        setPartnerOnline(computeOnline(date));
    }, [updatePartnerLastSeen, computeOnline]);

    // ── Main effect ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!coupleId || !myUserId || !partnerId) return;

        let heartbeatTimer: ReturnType<typeof setInterval>;
        let onlineCheckTimer: ReturnType<typeof setInterval>;

        // 1. Write my own presence immediately (persists across refresh)
        ping();

        // 2. Fetch partner's REAL last_seen_at from DB on mount.
        //    This is the fix for "starts from 0 on refresh" — we always read the
        //    DB value first rather than waiting for a realtime event.
        (async () => {
            const { data, error } = await supabase
                .from("profiles" as never)
                .select("last_seen_at")
                .eq("user_id", partnerId)
                .single() as unknown as {
                    data: { last_seen_at: string | null } | null;
                    error: unknown;
                };

            if (error || !data?.last_seen_at) return;
            const date = new Date(data.last_seen_at);
            if (!isNaN(date.getTime())) applyPartnerDate(date);
        })();

        // 3. Heartbeat — keeps my presence alive every 30 s
        heartbeatTimer = setInterval(ping, HEARTBEAT_MS);

        // 4. Online-check tick — re-evaluates partnerOnline every 15 s.
        //    Reads partnerLastSeenRef.current (always the latest value — never
        //    stale) instead of the old broken local-ref pattern.
        onlineCheckTimer = setInterval(() => {
            setPartnerOnline(computeOnline(partnerLastSeenRef.current));
        }, ONLINE_CHECK_MS);

        // 5. Realtime — partner's last_seen_at updated in DB → update instantly
        channelRef.current = supabase
            .channel(`presence:${coupleId}:${partnerId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `user_id=eq.${partnerId}`,
                },
                (payload) => {
                    const raw = (payload.new as Record<string, unknown>)?.last_seen_at;
                    if (!raw || typeof raw !== "string") return;
                    const date = new Date(raw);
                    if (!isNaN(date.getTime())) applyPartnerDate(date);
                },
            )
            .subscribe();

        // 6. Visibility — ping when tab becomes visible again; ping on hide so
        //    the partner sees an accurate "last seen" after we close the tab.
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                ping();
            } else {
                ping(); // best-effort on hide/close
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        // 7. Cleanup
        return () => {
            clearInterval(heartbeatTimer);
            clearInterval(onlineCheckTimer);
            document.removeEventListener("visibilitychange", handleVisibility);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            ping(); // final write on unmount / route change
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coupleId, myUserId, partnerId]);
    // ↑ Intentionally excludes ping/applyPartnerDate/computeOnline from deps —
    //   all are stable useCallback refs. Including them would cause the effect
    //   to re-run and re-subscribe on every render.

    return { partnerOnline, partnerLastSeen };
}