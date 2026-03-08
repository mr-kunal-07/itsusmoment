import { useState, useRef, useEffect } from "react";
import { Send, Trash2, MessageCircleHeart, Heart, Lock, Reply, X, Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, Message } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";
import { useAllProfiles, useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
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

function ReadReceipt({ msg, isMe, partnerId }: { msg: Message; isMe: boolean; partnerId: string | null }) {
  if (!isMe) return null;
  if (msg.read_at) return (
    <span className="flex items-center gap-0.5 text-primary" title={`Seen ${format(new Date(msg.read_at), "h:mm a")}`}>
      <CheckCheck className="h-3 w-3" />
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground/50" title="Sent">
      <Check className="h-3 w-3" />
    </span>
  );
}

export function ChatView() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const { data: myProfile } = useProfile();
  const { data: messages = [], sendMessage, deleteMessage, addReaction, removeReaction, isLoading } = useMessages();

  const [text, setText] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [emojiPickerId, setEmojiPickerId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Close emoji picker on outside click
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
    await sendMessage.mutateAsync({ content: trimmed, replyToId: replyId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-4 border-b mb-2">
        <div className="flex items-center -space-x-2">
          <Avatar className="h-9 w-9 ring-2 ring-background">
            <AvatarImage src={myProfile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{myInitials}</AvatarFallback>
          </Avatar>
          <Avatar className="h-9 w-9 ring-2 ring-background">
            <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">{partnerInitials}</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <h2 className="text-sm font-semibold font-heading">
            {myProfile?.display_name ?? "You"} &amp; {partnerProfile?.display_name ?? "Partner"}
          </h2>
          <p className="text-xs text-primary flex items-center gap-1">
            <Heart className="h-2.5 w-2.5 fill-primary" /> Private chat
          </p>
        </div>
        <MessageCircleHeart className="h-5 w-5 text-muted-foreground ml-auto" />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <span className="text-4xl">💌</span>
            <p className="text-sm font-medium">Send your first message</p>
            <p className="text-xs text-muted-foreground">Only you two can see this</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {groups.map(group => (
              <div key={group.day}>
                {/* Day divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground font-medium px-2">
                    {formatDay(group.messages[0].created_at)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-1">
                  {group.messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevSame = i > 0 && group.messages[i - 1].sender_id === msg.sender_id;
                    const nextSame = i < group.messages.length - 1 && group.messages[i + 1].sender_id === msg.sender_id;
                    const reactions = groupReactions(msg.reactions);
                    const repliedMsg = msg.reply_to_id ? msgMap[msg.reply_to_id] : null;

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex items-end gap-2 group relative", isMe ? "flex-row-reverse" : "flex-row")}
                        onMouseEnter={() => setHoveredId(msg.id)}
                        onMouseLeave={() => { setHoveredId(null); }}
                      >
                        {/* Avatar */}
                        <div className="w-7 shrink-0">
                          {!nextSame && (
                            <Avatar className="h-7 w-7">
                              {isMe ? (
                                <>
                                  <AvatarImage src={myProfile?.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{myInitials}</AvatarFallback>
                                </>
                              ) : (
                                <>
                                  <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{partnerInitials}</AvatarFallback>
                                </>
                              )}
                            </Avatar>
                          )}
                        </div>

                        {/* Bubble + reactions */}
                        <div className={cn("flex flex-col max-w-[68%]", isMe ? "items-end" : "items-start")}>
                          {/* Reply preview */}
                          {repliedMsg && (
                            <div className={cn(
                              "text-[11px] px-3 py-1 rounded-lg mb-0.5 border-l-2 opacity-70 max-w-full truncate",
                              isMe
                                ? "bg-primary/20 border-primary/60 text-primary-foreground/80"
                                : "bg-muted/60 border-muted-foreground/30 text-muted-foreground"
                            )}>
                              ↩ {repliedMsg.content.slice(0, 60)}{repliedMsg.content.length > 60 ? "…" : ""}
                            </div>
                          )}

                          <div
                            className={cn(
                              "px-3.5 py-2 text-sm leading-relaxed break-words",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                                : "bg-muted text-foreground rounded-2xl rounded-bl-md",
                              prevSame && isMe && "rounded-tr-md",
                              prevSame && !isMe && "rounded-tl-md"
                            )}
                          >
                            {msg.content}
                          </div>

                          {/* Emoji reactions */}
                          {reactions.length > 0 && (
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {reactions.map(([emoji, count]) => {
                                const iMine = (msg.reactions ?? []).some(r => r.user_id === user?.id && r.emoji === emoji);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(msg, emoji)}
                                    className={cn(
                                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                                      iMine
                                        ? "bg-primary/10 border-primary/40 text-primary"
                                        : "bg-muted border-border text-muted-foreground hover:border-primary/30"
                                    )}
                                  >
                                    {emoji} {count > 1 && <span>{count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Time + read receipt */}
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 px-1 transition-opacity duration-150",
                            hoveredId === msg.id ? "opacity-100" : "opacity-0"
                          )}>
                            {format(new Date(msg.created_at), "h:mm a")}
                            <ReadReceipt msg={msg} isMe={isMe} partnerId={partnerId} />
                          </div>
                        </div>

                        {/* Hover actions */}
                        {hoveredId === msg.id && (
                          <div className={cn(
                            "flex items-center gap-0.5 shrink-0",
                            isMe ? "flex-row" : "flex-row-reverse"
                          )}>
                            {/* Emoji picker toggle */}
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setEmojiPickerId(id => id === msg.id ? null : msg.id); }}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
                                title="React"
                              >
                                😊
                              </button>
                              {emojiPickerId === msg.id && (
                                <div
                                  className={cn(
                                    "absolute bottom-8 flex gap-1 bg-popover border border-border rounded-xl px-2 py-1.5 shadow-lg z-50",
                                    isMe ? "right-0" : "left-0"
                                  )}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {EMOJI_REACTIONS.map(emoji => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReact(msg, emoji)}
                                      className="text-lg hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Reply */}
                            <button
                              onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Reply"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete (own only) */}
                            {isMe && (
                              <button
                                onClick={() => deleteMessage.mutateAsync(msg.id)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg mx-0 mt-2 border-l-2 border-primary">
          <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground flex-1 truncate">
            <span className="font-medium text-foreground">
              {replyTo.sender_id === user?.id ? "You" : (partnerProfile?.display_name ?? "Partner")}:
            </span>{" "}
            {replyTo.content.slice(0, 80)}{replyTo.content.length > 80 ? "…" : ""}
          </p>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="pt-3 border-t mt-2">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? "Write a reply…" : `Message ${partnerProfile?.display_name ?? "your partner"}…`}
            className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary/40 px-4"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-9 w-9 shrink-0"
            disabled={!text.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
          🔒 End-to-end private between you two
        </p>
      </div>
    </div>
  );
}
