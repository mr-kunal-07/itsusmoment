import { useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyCouple } from "@/hooks/useCouple";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfDay } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreakData {
    current: number;
    longest: number;
    bothSentToday: boolean;
    waitingForPartner: boolean;
    atRisk: boolean;
    milestone: number | null;
    activeDays: string[];
}

export interface UseMessageStreakReturn extends StreakData {
    isLoading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MILESTONES = [3, 7, 14, 30, 50, 100, 365] as const;

// ─── DB row shape ─────────────────────────────────────────────────────────────

interface StreakRow {
    streak_count: number;
    streak_longest: number;
    streak_last_day: string | null;   // "YYYY-MM-DD"
    streak_updated_at: string | null;
}

interface TodayMessageRow {
    sender_id: string;
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

    // ── Read streak fields directly from couples row ───────────────────────────
    // This is a single column read — no scanning messages at all.
    const { data: streakRow, isLoading: loadingStreak } = useQuery<StreakRow | null>({
        queryKey: ["streak", coupleId],
        enabled: !!coupleId,
        staleTime: Infinity, // realtime keeps this fresh
        queryFn: async () => {
            const { data, error } = await supabase
                .from("couples" as never)
                .select("streak_count, streak_longest, streak_last_day, streak_updated_at")
                .eq("id", coupleId!)
                .single() as unknown as { data: StreakRow | null; error: unknown };

            if (error || !data) return null;
            return data;
        },
    });

    // ── Today's messages — who has sent today ─────────────────────────────────
    // Still needed to compute bothSentToday / waitingForPartner.
    // This is a tiny query: only today's messages, only sender_id column.
    const { data: todayMessages = [], isLoading: loadingToday } = useQuery<TodayMessageRow[]>({
        queryKey: ["streak-today", coupleId],
        enabled: !!coupleId,
        staleTime: 0, // always fresh
        queryFn: async () => {
            const localTodayStart = startOfDay(new Date());
            const { data, error } = await supabase
                .from("messages" as never)
                .select("sender_id")
                .eq("couple_id", coupleId!)
                .is("deleted_at", null)
                .gte("created_at", localTodayStart.toISOString()) as unknown as {
                    data: TodayMessageRow[] | null;
                    error: unknown;
                };
            if (error || !data) return [];
            return data;
        },
    });

    // ── Realtime — couples row updates when the trigger fires ──────────────────
    // The DB trigger updates streak_count the moment a message is inserted.
    // We push that update directly into the query cache — no refetch needed.
    useEffect(() => {
        if (!coupleId) return;

        if (channelRef.current) supabase.removeChannel(channelRef.current);

        channelRef.current = supabase
            .channel(`streak-field:${coupleId}`)
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
                    // Only update streak fields — don't stomp other couples fields
                    queryClient.setQueryData<StreakRow | null>(
                        ["streak", coupleId],
                        prev => prev ? {
                            ...prev,
                            streak_count: updated.streak_count as number ?? prev.streak_count,
                            streak_longest: updated.streak_longest as number ?? prev.streak_longest,
                            streak_last_day: updated.streak_last_day as string ?? prev.streak_last_day,
                            streak_updated_at: updated.streak_updated_at as string ?? prev.streak_updated_at,
                        } : prev
                    );
                    // Also invalidate today's messages so bothSentToday updates
                    queryClient.invalidateQueries({ queryKey: ["streak-today", coupleId] });
                },
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [coupleId, queryClient]);

    // ── Derive display values from DB fields ───────────────────────────────────
    const result = useMemo<StreakData>(() => {
        const today = format(startOfDay(new Date()), "yyyy-MM-dd");
        const yesterday = format(subDays(startOfDay(new Date()), 1), "yyyy-MM-dd");

        const current = streakRow?.streak_count ?? 0;
        const longest = streakRow?.streak_longest ?? 0;
        const lastDay = streakRow?.streak_last_day ?? null;

        // atRisk: streak is alive (last_day = yesterday) but nobody sent today yet
        const atRisk = current > 0 && lastDay === yesterday;

        // bothSentToday / waitingForPartner
        const sendersTodaySet = new Set(todayMessages.map(m => m.sender_id));
        const bothSentToday = !!user?.id && !!partnerId
            && sendersTodaySet.has(user.id)
            && sendersTodaySet.has(partnerId);
        const waitingForPartner = !!user?.id && !!partnerId
            && sendersTodaySet.has(user.id)
            && !sendersTodaySet.has(partnerId);

        // milestone
        const milestone = (MILESTONES as readonly number[]).includes(current)
            ? current
            : null;

        // activeDays — last 7 days for the calendar dots
        // We derive this from streak_last_day and streak_count: walk back
        // streak_count days from last_day (capped at 7 for the badge UI)
        const activeDays: string[] = [];
        if (lastDay && current > 0) {
            let cursor = new Date(lastDay);
            const cap = Math.min(current, 7);
            for (let i = 0; i < cap; i++) {
                activeDays.unshift(format(cursor, "yyyy-MM-dd"));
                cursor = subDays(cursor, 1);
            }
        }

        return { current, longest, atRisk, bothSentToday, waitingForPartner, milestone, activeDays };
    }, [streakRow, todayMessages, user?.id, partnerId]);

    return {
        ...result,
        isLoading: loadingStreak || loadingToday,
    };
}