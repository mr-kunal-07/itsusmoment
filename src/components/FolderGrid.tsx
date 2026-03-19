import { useState, useCallback, useId } from "react";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────── */
interface FolderItem {
    id: string;
    name: string;
    count?: number;
    previewUrls?: string[];
}

interface Props {
    folders: FolderItem[];
    onOpen: (id: string) => void;
}

/* ── Constants ───────────────────────────────────────────────────── */
const COLLAGE = { x: 10, y: 52, w: 132, h: 68, gap: 2 } as const;

/* ── Empty State ─────────────────────────────────────────────────── */
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 select-none">
            <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                className="mb-5 opacity-60"
                aria-hidden="true"
            >
                <rect
                    x="2" y="14" width="60" height="44" rx="8"
                    className="fill-amber-200 dark:fill-amber-800"
                    stroke="currentColor" strokeOpacity="0.06" strokeWidth="0.5"
                />
                <path
                    d="M2 22 Q2 14 10 14 L24 14 Q28 14 30 18 L32 22 L62 22 L62 58 Q62 58 54 58 L10 58 Q2 58 2 50 Z"
                    className="fill-amber-300 dark:fill-amber-700"
                />
                <rect
                    x="2" y="22" width="60" height="36" rx="7"
                    className="fill-amber-200 dark:fill-amber-800"
                />
            </svg>
            <p className="text-[15px] font-semibold text-foreground tracking-tight">
                No folders yet
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
                Create a folder to get started
            </p>
        </div>
    );
}

/* ── Collage layout ──────────────────────────────────────────────── */
interface CollageProps {
    previews: string[];
    clipId: string;
}

function FolderCollage({ previews, clipId }: CollageProps) {
    const { x, y, w, h, gap } = COLLAGE;
    const count = Math.min(previews.length, 4);
    const clip = `url(#${clipId})`;

    if (count === 1) {
        return (
            <image
                href={previews[0]}
                x={x} y={y} width={w} height={h}
                preserveAspectRatio="xMidYMid slice"
                clipPath={clip}
            />
        );
    }

    const cw = Math.floor((w - gap) / 2);
    const ch = Math.floor((h - gap) / 2);
    const x2 = x + cw + gap;
    const y2 = y + ch + gap;

    if (count === 2) {
        return (
            <g clipPath={clip}>
                <image href={previews[0]} x={x} y={y} width={cw} height={h} preserveAspectRatio="xMidYMid slice" />
                <image href={previews[1]} x={x2} y={y} width={cw} height={h} preserveAspectRatio="xMidYMid slice" />
            </g>
        );
    }

    if (count === 3) {
        return (
            <g clipPath={clip}>
                <image href={previews[0]} x={x} y={y} width={cw} height={h} preserveAspectRatio="xMidYMid slice" />
                <image href={previews[1]} x={x2} y={y} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
                <image href={previews[2]} x={x2} y={y2} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
            </g>
        );
    }

    return (
        <g clipPath={clip}>
            <image href={previews[0]} x={x} y={y} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
            <image href={previews[1]} x={x2} y={y} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
            <image href={previews[2]} x={x} y={y2} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
            <image href={previews[3]} x={x2} y={y2} width={cw} height={ch} preserveAspectRatio="xMidYMid slice" />
        </g>
    );
}

/* ── Folder Icon SVG ─────────────────────────────────────────────── */
interface FolderIconProps {
    uid: string;
    previewUrls?: string[];
    isHovered: boolean;
}

function FolderIcon({ uid, previewUrls, isHovered }: FolderIconProps) {
    const previews = previewUrls?.slice(0, 4) ?? [];
    const hasPreviews = previews.length > 0;
    const clipId = `clip-${uid}`;
    const gradBackId = `gb-${uid}`;
    const gradFrontId = `gf-${uid}`;
    const { x, y, w, h } = COLLAGE;

    return (
        <div className="relative w-full select-none" style={{ aspectRatio: "1 / 0.85" }}>
            <svg
                viewBox="0 0 152 128"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                aria-hidden="true"
                style={{
                    filter: isHovered
                        ? "drop-shadow(0 10px 24px rgba(0,0,0,0.20)) drop-shadow(0 2px 5px rgba(0,0,0,0.12))"
                        : "drop-shadow(0 5px 14px rgba(0,0,0,0.13)) drop-shadow(0 1px 3px rgba(0,0,0,0.09))",
                    transition: "filter 0.2s ease",
                }}
            >
                <defs>
                    <linearGradient id={gradBackId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FBD95B" />
                        <stop offset="100%" stopColor="#F5A623" />
                    </linearGradient>
                    <linearGradient id={gradFrontId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FDEEA0" />
                        <stop offset="100%" stopColor="#FAD44A" />
                    </linearGradient>
                    {hasPreviews && (
                        <clipPath id={clipId}>
                            <rect x={x} y={y} width={w} height={h} rx="6" />
                        </clipPath>
                    )}
                </defs>

                {/* Back tab */}
                <path
                    d="M8 36 Q8 26 18 26 L58 26 Q65 26 69 33 L76 42 L144 42 Q152 42 152 50 L152 118 Q152 126 144 126 L8 126 Q0 126 0 118 L0 44 Q0 36 8 36Z"
                    fill={`url(#${gradBackId})`}
                />

                {/* Front body */}
                <rect x="0" y="42" width="152" height="84" rx="10" fill={`url(#${gradFrontId})`} />

                {/* Inner area */}
                {hasPreviews ? (
                    <>
                        <FolderCollage previews={previews} clipId={clipId} />
                        <rect x={x} y={y} width={w} height={h} rx="6"
                            fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
                        <rect x={x} y={y} width={w} height="13" rx="6"
                            fill="rgba(255,255,255,0.10)" />
                    </>
                ) : (
                    <>
                        <rect x={x} y={y} width={w} height={h} rx="6"
                            fill="rgba(255,255,255,0.18)" />
                        <line x1="26" y1="74" x2="122" y2="74"
                            stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="26" y1="86" x2="98" y2="86"
                            stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="26" y1="98" x2="110" y2="98"
                            stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                )}

                {/* Top sheen */}
                <rect x="0" y="42" width="152" height="16" rx="10"
                    fill="rgba(255,255,255,0.13)" />
            </svg>
        </div>
    );
}

/* ── Folder Card ─────────────────────────────────────────────────── */
interface FolderCardProps {
    folder: FolderItem;
    onOpen: (id: string) => void;
}

function FolderCard({ folder, onOpen }: FolderCardProps) {
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);

    const handleOpen = useCallback(() => onOpen(folder.id), [folder.id, onOpen]);

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => { setHovered(false); setPressed(false); }, []);
    const handleMouseDown = useCallback(() => setPressed(true), []);
    const handleMouseUp = useCallback(() => setPressed(false), []);
    const handleTouchStart = useCallback(() => setPressed(true), []);
    const handleTouchEnd = useCallback(() => setPressed(false), []);

    const handleKeyUp = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") handleOpen();
        },
        [handleOpen]
    );

    return (
        <button
            type="button"
            aria-label={`Open folder: ${folder.name}`}
            onClick={handleOpen}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyUp={handleKeyUp}
            className={cn(
                "group flex flex-col items-center gap-1.5 w-full",
                "rounded-xl px-2 py-2.5",
                "transition-all duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                hovered && !pressed && "bg-black/[0.04] dark:bg-white/[0.06]",
                pressed && "bg-black/[0.07] dark:bg-white/[0.09]",
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
        >
            {/* Icon */}
            <div
                className="w-full"
                style={{
                    transform: pressed
                        ? "translateY(0px) scale(0.97)"
                        : hovered
                            ? "translateY(-2px) scale(1.03)"
                            : "translateY(0px) scale(1)",
                    transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                }}
            >
                <FolderIcon
                    uid={folder.id}
                    previewUrls={folder.previewUrls}
                    isHovered={hovered && !pressed}
                />
            </div>

            {/* Label */}
            <div className="w-full text-center px-1 min-w-0">
                <p
                    className={cn(
                        "text-[12px] sm:text-[13px] font-medium leading-tight tracking-[-0.01em] truncate",
                        hovered ? "text-primary" : "text-foreground",
                    )}
                    style={{ transition: "color 0.15s ease" }}
                    title={folder.name}
                >
                    {folder.name}
                </p>
                {typeof folder.count === "number" && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        {folder.count} {folder.count === 1 ? "item" : "items"}
                    </p>
                )}
            </div>
        </button>
    );
}

/* ── Main Grid ───────────────────────────────────────────────────── */
export function FolderGrid({ folders, onOpen }: Props) {
    if (!folders?.length) return <EmptyState />;

    return (
        <div className="grid gap-1 sm:gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} onOpen={onOpen} />
            ))}
        </div>
    );
}