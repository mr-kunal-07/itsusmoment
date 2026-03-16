// ─── LastSeenText ─────────────────────────────────────────────────────────────
// Drop-in replacement for the inline last-seen string in ChatView.
//
// Fixes:
//   1. Accepts string | Date | number — always coerces to Date correctly.
//   2. Self-refreshes every 30 s so "2 minutes ago" doesn't go stale.
//   3. Uses smarter formatting:
//        < 60 s  → "just now"
//        < 1 h   → "X minutes ago"
//        < 24 h  → "X hours ago"
//        same calendar day → "today at HH:mm"
//        yesterday         → "yesterday at HH:mm"
//        older             → "Mon 14 Mar at HH:mm"

import { memo, useState, useEffect } from "react";
import {
    formatDistanceToNow,
    isToday,
    isYesterday,
    format,
    differenceInSeconds,
} from "date-fns";

interface Props {
    lastSeen: string | Date | number | null | undefined;
}

function formatLastSeen(raw: string | Date | number): string {
    // Always coerce — Supabase returns ISO strings, some callers pass Date/ms
    const date = raw instanceof Date ? raw : new Date(raw);

    // Guard against invalid dates (e.g. malformed strings)
    if (isNaN(date.getTime())) return "offline";

    const secsAgo = differenceInSeconds(new Date(), date);

    if (secsAgo < 60) return "just now";
    if (secsAgo < 3600) return `${Math.floor(secsAgo / 60)}m ago`;
    if (secsAgo < 86400) return `${Math.floor(secsAgo / 3600)}h ago`;

    const timeStr = format(date, "HH:mm");
    if (isToday(date)) return `today at ${timeStr}`;
    if (isYesterday(date)) return `yesterday at ${timeStr}`;
    return format(date, "EEE d MMM") + ` at ${timeStr}`;
}

export const LastSeenText = memo(function LastSeenText({ lastSeen }: Props) {
    const [, forceUpdate] = useState(0);

    // Tick every 30 s so the label stays fresh without prop changes
    useEffect(() => {
        const id = setInterval(() => forceUpdate((n) => n + 1), 30_000);
        return () => clearInterval(id);
    }, []);

    if (!lastSeen) return <span>offline</span>;

    return <span>last seen {formatLastSeen(lastSeen)}</span>;
});