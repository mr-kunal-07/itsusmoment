import { useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import {
    differenceInCalendarDays,
    startOfDay,
    subDays,
    format,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakData {
    /** Current consecutive-day streak (0 if no messages today or yesterday) */
    current: number;
    /** Longest streak ever achieved by this couple */
    longest: number;
    /** Whether both partners sent a message today */
    bothSentToday: boolean;
    /** Whether only the current user has sent today (partner hasn't yet) */
    waitingForPartner: boolean;
    /** True if the streak was alive yesterday but dies today if no one sends */
    atRisk: boolean;
    /** Milestone to celebrate, if just reached (e.g. 7, 14, 30, 50, 100) */
    milestone: number | null;
    /** ISO date strings of all active-streak days (for calendar display) */
    activeDays: string[];
}

export interface UseMessageStreakReturn extends StreakData {
    isLoading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MILESTONES = [3, 7, 14, 30, 50, 100, 365] as const;
const STALE_TIME = 1000 * 60 * 5; // 5 minutes — re-fetches on focus automatically

// ─── Streak computation ───────────────────────────────────────────────────────

interface MessageDayRow {
    message_day: string; // "YYYY-MM-DD"
    couple_id: string;
}

interface MessageRow {
    created_at: string;
    sender_id: string;
}

function computeStreak(
    days: string[],          // sorted DESC, unique YYYY-MM-DD strings
    todayMessages: MessageRow[],
    myUserId: string,
    partnerId: string
): Omit<StreakData, "isLoading"> {
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const yesterday = format(subDays(startOfDay(new Date()), 1), "yyyy-MM-dd");

    // ── Both-sent-today & waiting logic ───────────────────────────────────────
    const sendersTodaySet = new Set(
        todayMessages
            .filter(m => format(new Date(m.created_at), "yyyy-MM-dd") === today)
            .map(m => m.sender_id)
    );
    const bothSentToday = sendersTodaySet.has(myUserId) && sendersTodaySet.has(partnerId);
    const waitingForPartner = sendersTodaySet.has(myUserId) && !sendersTodaySet.has(partnerId);

    // ── Build streak from sorted days ─────────────────────────────────────────
    // Streak is alive if there's a message today OR yesterday
    // (so users in different timezones don't lose their streak at midnight)
    const daySet = new Set(days);
    const hasToday = daySet.has(today);
    const hasYesterday = daySet.has(yesterday);

    // If neither today nor yesterday has a message, streak is 0
    if (!hasToday && !hasYesterday) {
        return {
            current: 0,
            longest: computeLongest(days),
            bothSentToday,
            waitingForPartner,
            atRisk: false,
            milestone: null,
            activeDays: [],
        };
    }

    // Walk backwards from today (or yesterday) counting consecutive days
    let cursor = hasToday ? new Date(today) : new Date(yesterday);
    let streak = 0;
    const activeDays: string[] = [];

    // Safety: cap at 5 years of history to prevent infinite loop
    const limit = 365 * 5;
    for (let i = 0; i < limit; i++) {
        const key = format(cursor, "yyyy-MM-dd");
        if (!daySet.has(key)) break;
        streak++;
        activeDays.push(key);
        cursor = subDays(cursor, 1);
    }

    // atRisk: streak is alive from yesterday but user hasn't sent anything today
    const atRisk = !hasToday && hasYesterday;

    // milestone: check if current streak just hit a milestone number
    const milestone = MILESTONES.find(m => m === streak) ?? null;

    return {
        current: streak,
        longest: computeLongest(days),
        bothSentToday,
        waitingForPartner,
        atRisk,
        milestone,
        activeDays,
    };
}

function computeLongest(days: string[]): number {
    if (!days.length) return 0;
    // days is sorted DESC — reverse to walk forwards
    const sorted = [...days].sort();
    let longest = 1;
    let run = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        if (differenceInCalendarDays(curr, prev) === 1) {
            run++;
            if (run > longest) longest = run;
        } else {
            run = 1;
        }
    }
    return longest;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessageStreak(): UseMessageStreakReturn {
    const { user } = useAuth();
    const { data: couple } = useMyCouple();
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const coupleId = couple?.status === "active" ? couple.id : null;
    const partnerId = couple?.status === "active"
        ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
        : null;

    // ── Fetch message days from the view ─────────────────────────────────────
    const { data: rawDays = [], isLoading: loadingDays } = useQuery<string[]>({
        queryKey: ["streak-days", coupleId],
        enabled: !!coupleId,
        staleTime: STALE_TIME,
        queryFn: async () => {
            // Pull last 400 days — enough for longest-streak calculation without
            // loading the entire messages table
            const since = format(subDays(new Date(), 400), "yyyy-MM-dd");

            const { data, error } = await supabase
                .from("couple_message_days" as never)
                .select("message_day")
                .eq("couple_id", coupleId!)
                .gte("message_day", since)
                .order("message_day", { ascending: false }) as unknown as {
                    data: MessageDayRow[] | null;
                    error: unknown;
                };

            if (error || !data) return [];
            return data.map(r => r.message_day);
        },
    });

    // ── Fetch today's messages (lightweight — sender_id only) ─────────────────
    const { data: todayMessages = [], isLoading: loadingToday } = useQuery<MessageRow[]>({
        queryKey: ["streak-today", coupleId],
        enabled: !!coupleId,
        staleTime: 0, // always fresh — this is the live "who sent today" check
        queryFn: async () => {
            const todayStart = format(startOfDay(new Date()), "yyyy-MM-dd");
            const { data, error } = await supabase
                .from("messages" as never)
                .select("created_at, sender_id")
                .eq("couple_id", coupleId!)
                .gte("created_at", `${todayStart}T00:00:00Z`) as unknown as {
                    data: MessageRow[] | null;
                    error: unknown;
                };
            if (error || !data) return [];
            return data;
        },
    });

    // ── Realtime: invalidate streak on any new message ────────────────────────
    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["streak-days", coupleId] });
        queryClient.invalidateQueries({ queryKey: ["streak-today", coupleId] });
    }, [coupleId, queryClient]);

    useEffect(() => {
        if (!coupleId) return;

        channelRef.current = supabase
            .channel(`streak:${coupleId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
                invalidate
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [coupleId, invalidate]);

    // ── Compute streak from fetched data ──────────────────────────────────────
    const streak = useMemo<Omit<StreakData, "isLoading">>(() => {
        if (!user?.id || !partnerId) {
            return {
                current: 0, longest: 0,
                bothSentToday: false, waitingForPartner: false,
                atRisk: false, milestone: null, activeDays: [],
            };
        }
        return computeStreak(rawDays, todayMessages, user.id, partnerId);
    }, [rawDays, todayMessages, user?.id, partnerId]);

    return {
        ...streak,
        isLoading: loadingDays || loadingToday,
    };
}