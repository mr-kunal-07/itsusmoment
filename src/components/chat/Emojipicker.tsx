import { useEffect, useRef, memo, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { Theme, SkinTones } from "emoji-picker-react";

const EmojiPickerLib = lazy(() => import("emoji-picker-react"));

interface Props {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export const EmojiPicker = memo(function EmojiPicker({ onSelect, onClose }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    // FIX: use `pointerdown` instead of `mousedown` and check composedPath()
    // so that touch-scroll events inside the picker on iOS do not close it.
    // composedPath() traverses shadow DOM correctly (emoji-picker-react renders
    // into a shadow root in some versions), whereas .contains() only works on
    // light DOM children and misses shadow DOM nodes, causing false closes.
    useEffect(() => {
        const handler = (e: PointerEvent) => {
            const path = e.composedPath();
            if (containerRef.current && !path.includes(containerRef.current)) {
                onClose();
            }
        };
        // Small delay so the button that opened us doesn't immediately close
        const tid = setTimeout(() => document.addEventListener("pointerdown", handler), 80);
        return () => { clearTimeout(tid); document.removeEventListener("pointerdown", handler); };
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "absolute bottom-full left-0 mb-2 z-50",
                "animate-in fade-in slide-in-from-bottom-2 duration-150",
            )}
            // FIX: stopPropagation on pointerdown so internal interactions
            // never bubble up to the document handler above
            onPointerDown={e => e.stopPropagation()}
            role="dialog"
            aria-label="Emoji picker"
            aria-modal="true"
        >
            <Suspense
                fallback={
                    <div
                        className="flex items-center justify-center rounded-[20px] border border-border shadow-xl"
                        style={{
                            width: "clamp(300px, 90vw, 360px)",
                            height: 380,
                            background: "hsl(var(--wa-header))",
                        }}
                    >
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(var(--wa-meta))" }} />
                    </div>
                }
            >
                <EmojiPickerInner
                    onSelect={onSelect}
                    isDark={theme === "dark"}
                />
            </Suspense>
        </div>
    );
});

const EmojiPickerInner = memo(function EmojiPickerInner({
    onSelect,
    isDark,
}: {
    onSelect: (emoji: string) => void;
    isDark: boolean;
}) {
    return (
        <EmojiPickerLib
            onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
            theme={isDark ? Theme.DARK : Theme.LIGHT}
            width="clamp(300px, 90vw, 360px)"
            height={400}
            autoFocusSearch
            searchPlaceholder="Search emoji…"
            previewConfig={{ showPreview: false }}
            defaultSkinTone={SkinTones.NEUTRAL}
            skinTonesDisabled={false}
            style={{
                "--epr-bg-color": "hsl(var(--wa-header))",
                "--epr-category-label-bg-color": "hsl(var(--wa-header))",
                "--epr-search-input-bg-color": "hsl(var(--wa-input-bg))",
                "--epr-search-input-text-color": "hsl(var(--wa-text))",
                "--epr-search-input-placeholder-color": "hsl(var(--wa-meta))",
                "--epr-text-color": "hsl(var(--wa-text))",
                "--epr-hover-bg-color": "hsl(var(--wa-system-bubble))",
                "--epr-focus-bg-color": "hsl(var(--wa-system-bubble))",
                "--epr-highlight-color": "hsl(var(--wa-online))",
                "--epr-border-color": "hsl(var(--border))",
                "--epr-header-padding": "8px 8px 0",
                "--epr-emoji-size": "26px",
                "--epr-emoji-gap": "4px",
                "--epr-border-radius": "20px",
                "--epr-shadow": "0 8px 32px rgba(0,0,0,0.20)",
                "--epr-active-skin-tone-indicator-border-color": "hsl(var(--wa-online))",
                "--epr-category-navigation-button-size": "28px",
                "--epr-scrollbar-thumb-color": "hsl(var(--wa-meta) / 0.3)",
                overflow: "hidden",
                borderRadius: 20,
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 32px rgba(0,0,0,0.20)",
            } as React.CSSProperties}
        />
    );
});

export default EmojiPicker;