import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfDay, parseISO } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakData {
    /** Current streak count */
    current: number;
    /** All-time longest streak */
    longest: number;
    /** I have sent in the current window */
    iSent: boolean;
    /** Partner has sent in the current window */
    partnerSent: boolean;
    /** Both sent — window is complete (streak will increment on next DB sync) */
    bothSent: boolean;
    /** I sent but partner hasn't yet */
    waitingForPartner: boolean;
    /** Neither sent yet in current window */
    neitherSent: boolean;
    /** Window exists, expires in < 4 hours, and not both sent yet */
    atRisk: boolean;
    /** ms until current window expires (null if no open window) */
    timeLeftMs: number | null;
    /** Absolute Date when window expires (null if no open window) */
    windowExpiresAt: Date | null;
    /** Currently active milestone number, or null */
    milestone: number | null;
    /** Last 7 calendar-day date strings ("yyyy-MM-dd") where streak was active */
    activeDays: string[];
}

export interface UseMessageStreakReturn extends StreakData {
    isLoading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MILESTONES = [3, 7, 14, 30, 50, 100, 365] as const;
const WINDOW_MS = 24 * 60 * 60 * 1000;   // 24 hours in ms
const AT_RISK_MS = 4 * 60 * 60 * 1000;   // 4 hours in ms — show hourglass warning

// ─── DB row shape ─────────────────────────────────────────────────────────────

interface StreakRow {
    streak_count: number;
    streak_longest: number;
    streak_window_start: string | null;  // ISO timestamptz from Supabase
    streak_window_complete: boolean;
    streak_user1_sent: boolean;
    streak_user2_sent: boolean;
    user1_id: string;
    user2_id: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Rolling 24-hour chat streak — Snapchat style.
 *
 * A streak increments when BOTH partners send at least one chat message
 * within a 24-hour window. The window opens the moment the first person
 * sends after the previous window closed. If the window expires before
 * both have sent, the streak resets to 0.
 *
 * The DB trigger (streak_migration.sql) handles all mutations.
 * This hook is read-only — it subscribes to realtime changes and
 * derives display state from the DB values.
 */
export function useMessageStreak(): UseMessageStreakReturn {
    const { user } = useAuth();
    const { data: couple } = useMyCouple();
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Live clock — ticks every 30 seconds to keep timeLeftMs fresh
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(id);
    }, []);

    const coupleId = couple?.status === "active" ? couple.id : null;

    // ── Fetch streak row ────────────────────────────────────────────────────────
    const { data: row, isLoading } = useQuery<StreakRow | null>({
        queryKey: ["streak-v2", coupleId],
        enabled: !!coupleId,
        staleTime: Infinity,  // realtime keeps this fresh
        queryFn: async () => {
            const { data, error } = await supabase
                .from("couples" as never)
                .select(
                    "streak_count, streak_longest, streak_window_start, streak_window_complete, streak_user1_sent, streak_user2_sent, user1_id, user2_id"
                )
                .eq("id", coupleId!)
                .single() as unknown as { data: StreakRow | null; error: unknown };

            if (error || !data) return null;
            return data;
        },
    });

    // ── Realtime subscription ───────────────────────────────────────────────────
    // Whenever the DB trigger fires (on any message insert), it updates the
    // couples row. We push that straight into the query cache — no refetch.
    useEffect(() => {
        if (!coupleId) return;

        if (channelRef.current) supabase.removeChannel(channelRef.current);

        channelRef.current = supabase
            .channel(`streak-v2:${coupleId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "couples",
                    filter: `id=eq.${coupleId}`,
                },
                (payload) => {
                    const updated = payload.new as Record<string, unknown>;
                    queryClient.setQueryData<StreakRow | null>(
                        ["streak-v2", coupleId],
                        (prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                streak_count: (updated.streak_count as number) ?? prev.streak_count,
                                streak_longest: (updated.streak_longest as number) ?? prev.streak_longest,
                                streak_window_start: (updated.streak_window_start as string) ?? prev.streak_window_start,
                                streak_window_complete: (updated.streak_window_complete as boolean) ?? prev.streak_window_complete,
                                streak_user1_sent: (updated.streak_user1_sent as boolean) ?? prev.streak_user1_sent,
                                streak_user2_sent: (updated.streak_user2_sent as boolean) ?? prev.streak_user2_sent,
                            };
                        }
                    );
                    // Nudge the clock so timeLeftMs recalculates immediately
                    setNow(Date.now());
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [coupleId, queryClient]);

    // ── Derive display values ───────────────────────────────────────────────────
    const result = useMemo<StreakData>(() => {
        if (!row || !user?.id) {
            return {
                current: 0, longest: 0,
                iSent: false, partnerSent: false,
                bothSent: false, waitingForPartner: false, neitherSent: true,
                atRisk: false, timeLeftMs: null, windowExpiresAt: null,
                milestone: null, activeDays: [],
            };
        }

        const iAmUser1 = user.id === row.user1_id;
        const iSent = iAmUser1 ? row.streak_user1_sent : row.streak_user2_sent;
        const partnerSent = iAmUser1 ? row.streak_user2_sent : row.streak_user1_sent;
        // bothSent is authoritative from the DB — the trigger sets window_complete=true
        // the moment the 2nd person's message lands, so we don't rely on both flags
        // being true client-side (avoids a race where the realtime update arrives
        // before both individual sent-flags are reflected in the cache).
        const bothSent = row.streak_window_complete;

        // ── Window timing ────────────────────────────────────────────────────────
        let timeLeftMs: number | null = null;
        let windowExpiresAt: Date | null = null;
        let windowExpired = false;

        if (row.streak_window_start) {
            const windowStart = new Date(row.streak_window_start).getTime();
            const expires = windowStart + WINDOW_MS;
            windowExpiresAt = new Date(expires);
            timeLeftMs = Math.max(0, expires - now);
            windowExpired = now > expires;
        }

        // ── Effective current streak ─────────────────────────────────────────────
        // If the window has expired client-side before the DB has caught up
        // (e.g. no new message to trigger the reset), show 0 to avoid stale count.
        const current = windowExpired && !iSent && !partnerSent ? 0 : row.streak_count;
        const longest = row.streak_longest;

        const waitingForPartner = iSent && !partnerSent && !bothSent;
        const neitherSent = !iSent && !partnerSent && !bothSent;

        // atRisk: window is open, expiring in < 4h, and the pair is NOT yet complete
        const atRisk = !windowExpired
            && timeLeftMs !== null
            && timeLeftMs <= AT_RISK_MS
            && !bothSent
            && current > 0;

        // ── Milestone ────────────────────────────────────────────────────────────
        const milestone = (MILESTONES as readonly number[]).includes(current) ? current : null;

        // ── Active days (last 7 calendar days) ───────────────────────────────────
        // Derived from streak_count and when the last completed window was.
        // We walk back streak_count days from today (capped at 7).
        // If streak is alive (window not expired), today counts.
        const activeDays: string[] = [];
        const baseDate = windowExpired ? subDays(startOfDay(new Date()), 1) : startOfDay(new Date());
        const cap = Math.min(current, 7);
        for (let i = 0; i < cap; i++) {
            activeDays.unshift(format(subDays(baseDate, i), "yyyy-MM-dd"));
        }

        return {
            current, longest,
            iSent, partnerSent,
            bothSent, waitingForPartner, neitherSent,
            atRisk, timeLeftMs, windowExpiresAt,
            milestone, activeDays,
        };
    }, [row, user?.id, now]);

    return { ...result, isLoading };
}