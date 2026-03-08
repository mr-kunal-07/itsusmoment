import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Lock, Reply, X, Check, CheckCheck, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Play, Pause, ArrowLeft } from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages, Message } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";
import { useAllProfiles, useProfile } from "@/hooks/useProfile";
import { useTyping } from "@/hooks/useTyping";
import { usePresence } from "@/hooks/usePresence";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { cn } from "@/lib/utils";

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "TODAY";
  if (isYesterday(d)) return "YESTERDAY";
  return format(d, "MMMM d, yyyy").toUpperCase();
}

function groupByDay(messages: Message[]) {
  const groups: { day: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const day = format(new Date(msg.created_at), "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.messages.push(msg);
    else groups.push({ day, messages: [msg] });
  });
  return groups;
}

function groupReactions(reactions: Message["reactions"]) {
  const map: Record<string, number> = {};
  (reactions ?? []).forEach(r => { map[r.emoji] = (map[r.emoji] ?? 0) + 1; });
  return Object.entries(map);
}

function ReadReceipt({ msg, isMe }: { msg: Message; isMe: boolean }) {
  if (!isMe) return null;
  if (msg.read_at) return (
    <CheckCheck className="h-3.5 w-3.5 text-[hsl(var(--wa-tick-blue))] inline-block ml-0.5" />
  );
  return (
    <Check className="h-3.5 w-3.5 text-[hsl(var(--wa-meta))] inline-block ml-0.5" />
  );
}

/** WhatsApp-style voice bubble with play/pause, waveform, duration */
function AudioBubble({
  url, duration, avatarUrl, avatarFallback, isMe, time, msg,
}: {
  url: string; duration?: string; avatarUrl?: string;
  avatarFallback: string; isMe: boolean; time: string;
  msg: Message;
}) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const BARS = 30;

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const progress = audioDuration ? currentTime / audioDuration : 0;

  function formatAudioTime(s: number) {
    return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  }

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[280px] py-1">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration ?? null)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      />

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className="text-xs font-semibold" style={{ background: "hsl(var(--wa-avatar))", color: "white" }}>
          {avatarFallback}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Play button + waveform */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95"
            style={{ background: "hsl(var(--wa-voice-thumb))" }}
          >
            {playing
              ? <Pause className="h-3.5 w-3.5 text-[hsl(var(--wa-bg))]" />
              : <Play className="h-3.5 w-3.5 text-[hsl(var(--wa-bg))] ml-0.5" />
            }
          </button>

          {/* Waveform bars */}
          <div className="flex items-center gap-[2px] flex-1 h-8">
            {Array.from({ length: BARS }).map((_, i) => {
              const filled = i / BARS < progress;
              // Vary bar heights for realism
              const heights = [6,9,14,10,7,12,16,8,11,6,13,18,10,7,15,9,12,6,10,14,8,16,11,7,13,9,6,12,10,8];
              return (
                <span
                  key={i}
                  className="rounded-full w-[2.5px] shrink-0 transition-colors"
                  style={{
                    height: heights[i % heights.length] + "px",
                    background: filled
                      ? "hsl(var(--wa-voice-thumb))"
                      : "hsl(0 0% 100% / 0.25)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Duration + time + ticks */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>
            {playing && audioDuration
              ? formatAudioTime(currentTime)
              : (audioDuration ? formatAudioTime(audioDuration) : (duration ?? "0:00"))
            }
          </span>
          <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(var(--wa-meta))" }}>
            {time}
            {isMe && (
              msg.read_at
                ? <CheckCheck className="h-3 w-3 text-[hsl(var(--wa-tick-blue))] ml-0.5" />
                : <Check className="h-3 w-3 ml-0.5" style={{ color: "hsl(var(--wa-meta))" }} />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Swipeable wrapper: swipe right → trigger reply (mobile only) */
function SwipeableMessage({
  children, onSwipeReply, isMe,
}: {
  children: React.ReactNode;
  onSwipeReply: () => void;
  isMe: boolean;
}) {
  const startXRef = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const triggered = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    triggered.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const dx = e.touches[0].clientX - startXRef.current;
    // Only allow rightward swipe, cap at 60px
    if (dx > 0) {
      setOffset(Math.min(dx, 60));
      if (dx > 50 && !triggered.current) {
        triggered.current = true;
        onSwipeReply();
      }
    }
  };

  const onTouchEnd = () => {
    startXRef.current = null;
    setOffset(0);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? "transform 0.2s ease" : "none" }}
    >
      {children}
    </div>
  );
}

export function ChatView({ onBack }: { onBack?: () => void }) {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const { data: myProfile } = useProfile();
  const { data: messages = [], sendMessage, deleteMessage, addReaction, removeReaction, isLoading } = useMessages();

  const [text, setText] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const coupleId = couple?.status === "active" ? couple.id : null;
  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) : null;
  const { partnerTyping, sendTyping } = useTyping(coupleId, user?.id);
  const { partnerOnline, partnerLastSeen } = usePresence(coupleId, user?.id, partnerId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const handler = () => setEmojiPickerId(null);
    if (emojiPickerId) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [emojiPickerId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setText("");
    const replyId = replyTo?.id ?? null;
    setReplyTo(null);
    await sendMessage.mutateAsync({ content: trimmed, replyToId: replyId, messageType: "text" });
  };

  const handleVoiceSend = async (audioUrl: string, duration: string) => {
    setVoiceMode(false);
    const replyId = replyTo?.id ?? null;
    setReplyTo(null);
    await sendMessage.mutateAsync({ content: duration, replyToId: replyId, messageType: "voice", audioUrl });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value) sendTyping();
    // auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleReact = (msg: Message, emoji: string) => {
    const myReaction = (msg.reactions ?? []).find(r => r.user_id === user?.id && r.emoji === emoji);
    if (myReaction) removeReaction.mutate({ messageId: msg.id, emoji });
    else addReaction.mutate({ messageId: msg.id, emoji });
    setEmojiPickerId(null);
  };

  if (couple?.status !== "active") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading">No Partner Connected</h2>
          <p className="text-sm text-muted-foreground mt-1">Connect with your partner to start chatting.</p>
        </div>
      </div>
    );
  }

  const groups = groupByDay(messages);
  const msgMap = Object.fromEntries(messages.map(m => [m.id, m]));
  const myInitials = (myProfile?.display_name ?? user?.email ?? "Me").slice(0, 2).toUpperCase();
  const partnerInitials = (partnerProfile?.display_name ?? "?").slice(0, 2).toUpperCase();
  const partnerName = partnerProfile?.display_name ?? "Partner";

  return (
    <div
      className="flex flex-col overflow-hidden h-full"
      style={{ background: "#171716" }}
    >
      {/* ── WhatsApp-style Header ── */}
      <div
        className="flex items-center gap-2 px-3 py-3 shrink-0 z-10"
        style={{ background: "hsl(var(--wa-header))" }}
      >
        {/* Back button — mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="sm:hidden p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors mr-1 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="relative">
          <Avatar className="h-10 w-10 ring-2 ring-white/10">
            <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-sm font-semibold" style={{ background: "hsl(var(--wa-avatar))", color: "white" }}>
              {partnerInitials}
            </AvatarFallback>
          </Avatar>
          {/* Dynamic online/offline dot */}
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[hsl(var(--wa-header))] transition-colors"
            style={{ background: partnerOnline ? "hsl(var(--wa-online))" : "hsl(var(--wa-meta))" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-none truncate">{partnerName}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--wa-meta))" }}>
            {partnerTyping ? (
              <span style={{ color: "hsl(var(--wa-online))" }}>typing…</span>
            ) : partnerOnline ? (
              <span style={{ color: "hsl(var(--wa-online))" }}>online</span>
            ) : partnerLastSeen ? (
              <span>last seen {formatDistanceToNow(partnerLastSeen, { addSuffix: true })}</span>
            ) : (
              <span>offline</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Chat Wallpaper + Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 scroll-smooth"
        style={{ background: "#171716" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <div
              className="px-4 py-2 rounded-lg text-xs"
              style={{ background: "hsl(var(--wa-system-bubble))", color: "hsl(var(--wa-meta))" }}
            >
              🔒 Messages are private between you two
            </div>
            <div className="mt-6 text-4xl">💌</div>
            <p className="text-sm font-medium text-white/80">Send your first message</p>
          </div>
        ) : (
          <div className="space-y-1 pb-2">
            {groups.map(group => (
              <div key={group.day}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-3">
                  <span
                    className="text-[11px] font-medium px-3 py-1 rounded-full"
                    style={{
                      background: "hsl(var(--wa-system-bubble))",
                      color: "hsl(var(--wa-meta))",
                    }}
                  >
                    {formatDay(group.messages[0].created_at)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {group.messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevSame = i > 0 && group.messages[i - 1].sender_id === msg.sender_id;
                    const nextSame = i < group.messages.length - 1 && group.messages[i + 1].sender_id === msg.sender_id;
                    const reactions = groupReactions(msg.reactions);
                    const repliedMsg = msg.reply_to_id ? msgMap[msg.reply_to_id] : null;
                    const isVoice = (msg as any).message_type === "voice";
                    const audioUrl = (msg as any).audio_url;

                    return (
                      <SwipeableMessage
                        key={msg.id}
                        onSwipeReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                        isMe={isMe}
                      >
                      <div
                        className={cn(
                          "flex items-end gap-1.5 group relative",
                          isMe ? "justify-end pl-12 sm:pl-20" : "justify-start pr-12 sm:pr-20"
                        )}
                        onMouseEnter={() => setHoveredId(msg.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Partner avatar for first in a cluster */}
                        {!isMe && (
                          <div className="w-7 shrink-0 self-end mb-0.5">
                            {!nextSame && (
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                                <AvatarFallback className="text-[10px]" style={{ background: "hsl(var(--wa-avatar))", color: "white" }}>
                                  {partnerInitials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className={cn("flex flex-col max-w-[85%] sm:max-w-[70%]", isMe ? "items-end" : "items-start")}>
                          {/* Reply preview */}
                          {repliedMsg && (
                            <div
                              className="text-[11px] px-3 py-1.5 rounded-t-lg mb-0 w-full border-l-[3px] max-w-full"
                              style={{
                                background: isMe ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.1)",
                                borderColor: "hsl(var(--wa-online))",
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                              }}
                            >
                              <span className="font-semibold block" style={{ color: "hsl(var(--wa-online))" }}>
                                {repliedMsg.sender_id === user?.id ? "You" : partnerName}
                              </span>
                              <span className="opacity-70 truncate block">
                                {repliedMsg.content.slice(0, 60)}{repliedMsg.content.length > 60 ? "…" : ""}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className={cn(
                              "relative text-sm leading-relaxed break-words text-white shadow-sm",
                              isVoice ? "px-2 py-2" : "px-3 py-2 pb-1"
                            )}
                            style={{
                              background: isMe ? "hsl(var(--wa-bubble-out))" : "hsl(var(--wa-bubble-in))",
                              borderRadius: isMe
                                ? `12px 4px 12px 12px`
                                : `4px 12px 12px 12px`,
                              ...(prevSame && { borderRadius: "12px" }),
                            }}
                          >
                            {isVoice && audioUrl ? (
                              <AudioBubble
                                url={audioUrl}
                                duration={msg.content}
                                avatarUrl={isMe ? (myProfile?.avatar_url ?? undefined) : (partnerProfile?.avatar_url ?? undefined)}
                                avatarFallback={isMe ? myInitials : partnerInitials}
                                isMe={isMe}
                                time={format(new Date(msg.created_at), "h:mm a")}
                                msg={msg}
                              />
                            ) : (
                              <>
                                {/* Text + inline time spacer */}
                                <span className="break-words">{msg.content}</span>
                                {/* Invisible spacer so time doesn't overlap text */}
                                <span className="inline-block w-16 h-3 ml-1" aria-hidden />
                                {/* Time + ticks pinned bottom-right */}
                                <span
                                  className="absolute bottom-1.5 right-2.5 flex items-center gap-0.5 text-[10px] select-none leading-none whitespace-nowrap"
                                  style={{ color: "hsl(var(--wa-meta))" }}
                                >
                                  {format(new Date(msg.created_at), "h:mm a")}
                                  <ReadReceipt msg={msg} isMe={isMe} />
                                </span>
                              </>
                            )}
                          </div>

                          {/* Reactions */}
                          {reactions.length > 0 && (
                            <div className={cn("flex gap-1 mt-1 flex-wrap", isMe ? "justify-end" : "justify-start")}>
                              {reactions.map(([emoji, count]) => {
                                const iMine = (msg.reactions ?? []).some(r => r.user_id === user?.id && r.emoji === emoji);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(msg, emoji)}
                                    className={cn(
                                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors backdrop-blur-sm",
                                    )}
                                    style={{
                                      background: iMine ? "hsl(var(--wa-bubble-out) / 0.3)" : "hsl(var(--wa-system-bubble))",
                                      borderColor: iMine ? "hsl(var(--wa-online) / 0.5)" : "transparent",
                                      color: "white",
                                    }}
                                  >
                                    {emoji} {count > 1 && <span>{count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Hover actions */}
                        {hoveredId === msg.id && (
                          <div
                            className={cn(
                              "flex items-center gap-0.5 shrink-0 self-center",
                              isMe ? "order-first mr-1" : "order-last ml-1"
                            )}
                          >
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setEmojiPickerId(id => id === msg.id ? null : msg.id); }}
                                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-black/20 transition-colors text-sm"
                              >
                                <Smile className="h-4 w-4" />
                              </button>
                              {emojiPickerId === msg.id && (
                                <div
                                  className={cn(
                                    "absolute bottom-9 flex gap-1 rounded-2xl px-2.5 py-2 shadow-xl z-50 border border-white/10",
                                    isMe ? "right-0" : "left-0"
                                  )}
                                  style={{ background: "hsl(var(--wa-header))" }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {EMOJI_REACTIONS.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReact(msg, emoji)}
                                      className="text-xl hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-black/20 transition-colors"
                            >
                              <Reply className="h-4 w-4" />
                            </button>
                            {isMe && (
                              <button
                                onClick={() => deleteMessage.mutateAsync(msg.id)}
                                className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-black/20 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      </SwipeableMessage>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Typing bubbles */}
            {partnerTyping && (
              <div className="flex items-end gap-1.5 pr-12 sm:pr-20">
                <Avatar className="h-7 w-7 self-end mb-0.5">
                  <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]" style={{ background: "hsl(var(--wa-avatar))", color: "white" }}>
                    {partnerInitials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm"
                  style={{ background: "hsl(var(--wa-bubble-in))" }}
                >
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map(delay => (
                      <span
                        key={delay}
                        className="h-2 w-2 rounded-full animate-bounce"
                        style={{ background: "hsl(var(--wa-meta))", animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Reply Banner ── */}
      {replyTo && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 shrink-0 border-t border-white/10"
          style={{ background: "hsl(var(--wa-header))" }}
        >
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ background: "hsl(var(--wa-online))" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--wa-online))" }}>
              {replyTo.sender_id === user?.id ? "You" : partnerName}
            </p>
            <p className="text-xs opacity-60 truncate text-white">
              {replyTo.content.slice(0, 80)}{replyTo.content.length > 80 ? "…" : ""}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-white/50 hover:text-white transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div
        className="px-3 py-2.5 flex items-end gap-2 shrink-0"
        style={{ background: "hsl(var(--wa-bg))" }}
      >
        {voiceMode ? (
          <div className="flex-1">
            <VoiceRecorder
              onSend={handleVoiceSend}
              onCancel={() => setVoiceMode(false)}
              disabled={sendMessage.isPending}
            />
          </div>
        ) : (
          <>
            {/* Text area pill */}
            <div
              className="flex items-end flex-1 gap-2 rounded-3xl px-4 py-2"
              style={{ background: "hsl(var(--wa-input-bg))" }}
            >
              <button className="text-white/40 hover:text-white/70 transition-colors shrink-0 mb-0.5">
                <Smile className="h-5 w-5" />
              </button>
              <textarea
                ref={inputRef}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={replyTo ? "Write a reply…" : `Message…`}
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-white placeholder-white/30 leading-relaxed py-0.5 max-h-28 overflow-y-auto"
                autoComplete="off"
                style={{ minHeight: "24px" }}
              />
              <button className="text-white/40 hover:text-white/70 transition-colors shrink-0 mb-0.5">
                <Paperclip className="h-5 w-5" />
              </button>
            </div>

            {/* Send / Mic button */}
            {text.trim() ? (
              <button
                onClick={handleSend}
                disabled={sendMessage.isPending}
                className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                style={{ background: "hsl(var(--wa-online))" }}
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            ) : (
              <button
                onClick={() => setVoiceMode(true)}
                disabled={sendMessage.isPending}
                className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                style={{ background: "hsl(var(--wa-online))" }}
              >
                <Mic className="h-5 w-5 text-white" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
