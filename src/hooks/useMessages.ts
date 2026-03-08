import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  couple_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  reply_to_id: string | null;
  message_type?: string;
  audio_url?: string | null;
  reactions?: MessageReaction[];
}

export function useMessages() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const coupleId = couple?.status === "active" ? couple.id : null;

  const query = useQuery({
    queryKey: ["messages", coupleId],
    enabled: !!coupleId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages" as never)
        .select("*, reactions:message_reactions(*)")
        .eq("couple_id", coupleId!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  // Mark partner messages as read
  useEffect(() => {
    if (!coupleId || !user || !query.data?.length) return;
    const unread = query.data.filter(m => m.sender_id !== user.id && !m.read_at);
    if (!unread.length) return;
    supabase
      .from("messages" as never)
      .update({ read_at: new Date().toISOString() } as never)
      .in("id", unread.map(m => m.id))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
      });
  }, [query.data, coupleId, user, queryClient]);

  // Realtime subscription
  useEffect(() => {
    if (!coupleId || !user) return;

    channelRef.current = supabase
      .channel(`messages:${coupleId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, replyToId }: { content: string; replyToId?: string | null }) => {
      if (!coupleId || !user) throw new Error("Not connected");
      const { error } = await supabase
        .from("messages" as never)
        .insert({ sender_id: user.id, couple_id: coupleId, content, reply_to_id: replyToId ?? null } as never);
      if (error) throw error;
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.from("messages" as never).delete().eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", coupleId] }),
  });

  const addReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("message_reactions" as never)
        .insert({ message_id: messageId, user_id: user.id, emoji } as never);
      if (error && error.code !== "23505") throw error; // ignore duplicate
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", coupleId] }),
  });

  const removeReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("message_reactions" as never)
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", coupleId] }),
  });

  return { ...query, sendMessage, deleteMessage, addReaction, removeReaction, coupleId };
}
