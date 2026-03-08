import { useState, useRef, useEffect } from "react";
import { Send, Trash2, MessageCircleHeart, Heart, Lock } from "lucide-react";
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
    if (last && last.day === day) {
      last.messages.push(msg);
    } else {
      groups.push({ day, messages: [msg] });
    }
  });
  return groups;
}

export function ChatView() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const { data: myProfile } = useProfile();
  const { data: messages = [], sendMessage, deleteMessage, isLoading } = useMessages();

  const [text, setText] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    setText("");
    await sendMessage.mutateAsync(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not connected
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

                <div className="space-y-1.5">
                  {group.messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevSame = i > 0 && group.messages[i - 1].sender_id === msg.sender_id;
                    const nextSame = i < group.messages.length - 1 && group.messages[i + 1].sender_id === msg.sender_id;

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex items-end gap-2 group", isMe ? "flex-row-reverse" : "flex-row")}
                        onMouseEnter={() => setHoveredId(msg.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Avatar — only show for last in run */}
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

                        {/* Bubble */}
                        <div className={cn("flex flex-col max-w-[68%]", isMe ? "items-end" : "items-start")}>
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
                          {/* Timestamp on hover */}
                          <span className={cn(
                            "text-[10px] text-muted-foreground mt-0.5 px-1 transition-opacity duration-150",
                            hoveredId === msg.id ? "opacity-100" : "opacity-0"
                          )}>
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                        </div>

                        {/* Delete button (own messages only) */}
                        {isMe && hoveredId === msg.id && (
                          <button
                            onClick={() => deleteMessage.mutateAsync(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive shrink-0"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* Input */}
      <div className="pt-3 border-t mt-2">
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerProfile?.display_name ?? "your partner"}…`}
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
