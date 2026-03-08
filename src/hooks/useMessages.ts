import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";

export interface Message {
  id: string;
  sender_id: string;
  couple_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
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
        .select("*")
        .eq("couple_id", coupleId!)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!coupleId || !user) return;

    channelRef.current = supabase
      .channel(`messages:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!coupleId || !user) throw new Error("Not connected");
      const { error } = await supabase
        .from("messages" as never)
        .insert({ sender_id: user.id, couple_id: coupleId, content } as never);
      if (error) throw error;
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages" as never)
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", coupleId] });
    },
  });

  return { ...query, sendMessage, deleteMessage, coupleId };
}
