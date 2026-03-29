import { useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";
import { encryptText, decryptMessages } from "@/lib/crypto";
import { pushToPartner } from "@/hooks/usePushNotifications";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  deleted_at?: string | null;
  reactions?: MessageReaction[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MESSAGE_LIMIT = 150;

// Supabase realtime payload shapes — the SDK types `new`/`old` as
// Record<string, unknown>, so we cast through `unknown` to our domain types.
type RealtimeInsertPayload = { new: Record<string, unknown> };
type RealtimeUpdatePayload = { new: Record<string, unknown> };
type RealtimeDeletePayload = { old: Record<string, unknown> };

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessages() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const coupleId = couple?.status === "active" ? couple.id : null;
  const qKey = useMemo(() => ["messages", coupleId] as const, [coupleId]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: qKey,
    // FIX: staleTime Infinity — realtime writes directly into the cache so
    // React Query never needs to background-refetch. This was 10_000ms before,
    // meaning RQ would silently re-fetch every 10s causing a flicker.
    staleTime: Infinity,
    enabled: !!coupleId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages" as never)
        .select("*, reactions:message_reactions(*)")
        .eq("couple_id", coupleId!)
        // Exclude soft-deleted messages from the active chat list
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_LIMIT);
      if (error) throw error;
      const raw = ((data ?? []) as Message[]).reverse();
      return decryptMessages(raw, coupleId!);
    },
  });

  // ── Debounced mark-as-read ─────────────────────────────────────────────────
  const scheduleMarkRead = useCallback((unreadIds: string[]) => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      supabase
        .from("messages" as never)
        .update({ read_at: new Date().toISOString() } as never)
        .in("id", unreadIds)
        .then(() => {
          // FIX: patch read_at directly in cache — old code called
          // invalidateQueries here which triggered a full refetch every second
          queryClient.setQueryData<Message[]>(qKey, prev =>
            prev?.map(m =>
              unreadIds.includes(m.id)
                ? { ...m, read_at: new Date().toISOString() }
                : m
            ) ?? []
          );
        });
    }, 1_000);
  }, [queryClient, qKey]);

  useEffect(() => {
    if (!coupleId || !user || !query.data?.length) return;
    const unread = query.data.filter(m => m.sender_id !== user.id && !m.read_at);
    if (!unread.length) return;
    scheduleMarkRead(unread.map(m => m.id));
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [query.data, coupleId, user, scheduleMarkRead]);

  // ── Realtime handlers ──────────────────────────────────────────────────────
  // FIX: the root cause of "need to refresh to see messages".
  // The old code called invalidateQueries on every realtime event — this
  // triggers a full DB round-trip + re-render every time any message changes.
  // Instead we write directly into the React Query cache:
  //   INSERT → decrypt + append (partner messages only; own are optimistic)
  //   UPDATE → patch only scalar fields in place
  //   DELETE → splice out the deleted message
  //   reactions → one targeted refetch (reactions need the join re-run)

  // Supabase realtime payloads — the SDK types `new` / `old` as
  // `Record<string, unknown>` so we cast through `unknown` to our types.

  const handleMessageInsert = useCallback(async (payload: RealtimeInsertPayload) => {
    const incoming = payload.new as unknown as Message;

    // Own messages are already in the cache from the optimistic update.
    // Only process incoming messages from the partner.
    if (incoming.sender_id === user?.id) return;

    // Use the message's own couple_id — never rely on the stale closure value.
    const msgCoupleId = incoming.couple_id;
    if (!msgCoupleId) return;

    // Decrypt before writing to cache.
    // If decryption fails (key not ready, wrong key), fall back to showing
    // the raw message so it at least appears rather than silently disappearing.
    let decrypted: Message;
    try {
      const [d] = await decryptMessages(
        [{ ...incoming, reactions: [] }],
        msgCoupleId
      );
      decrypted = d;
    } catch (decryptErr) {
      console.error("[handleMessageInsert] decryption failed:", decryptErr);
      // Show the message anyway with original content so user knows it arrived
      decrypted = { ...incoming, reactions: [] };
    }

    const msgQKey = ["messages", msgCoupleId] as const;
    queryClient.setQueryData<Message[]>(msgQKey, prev => {
      if (!prev) return [decrypted];
      // Dedupe guard — in case the event fires twice
      if (prev.some(m => m.id === decrypted.id)) return prev;
      return [...prev, decrypted];
    });
  }, [user?.id, queryClient]);

  const handleMessageUpdate = useCallback((payload: RealtimeUpdatePayload) => {
    const updated = payload.new as unknown as Message;
    // FIX: if deleted_at was just set, treat this UPDATE as a removal so the
    // partner's UI also hides the message without a refresh
    if (updated.deleted_at) {
      queryClient.setQueryData<Message[]>(qKey, prev =>
        prev?.filter(m => m.id !== updated.id) ?? []
      );
      return;
    }
    queryClient.setQueryData<Message[]>(qKey, prev =>
      prev?.map(m =>
        m.id === updated.id
          // ONLY patch read_at — never patch content from an UPDATE event.
          // The content in the DB is encrypted ciphertext. Patching it here
          // would overwrite the plain-text content already in the cache,
          // making the message appear garbled for the current user.
          ? { ...m, read_at: updated.read_at }
          : m
      ) ?? []
    );
  }, [queryClient, qKey]);

  const handleMessageDelete = useCallback((payload: RealtimeDeletePayload) => {
    const deleted = payload.old as unknown as { id: string };
    queryClient.setQueryData<Message[]>(qKey, prev =>
      prev?.filter(m => m.id !== deleted.id) ?? []
    );
  }, [queryClient, qKey]);

  // Reactions are fetched via a join in the messages query.
  // Targeted invalidation here is the cleanest way to re-run the join —
  // it's a single small query and only triggers when reactions actually change.
  const handleReactionChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qKey });
  }, [queryClient, qKey]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!coupleId || !user) return;

    // Clean up any stale channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`messages:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
        handleMessageInsert,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
        handleMessageUpdate,
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `couple_id=eq.${coupleId}` },
        handleMessageDelete,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        handleReactionChange,
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coupleId, user, handleMessageInsert, handleMessageUpdate, handleMessageDelete, handleReactionChange]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      replyToId,
      messageType = "text",
      audioUrl,
    }: {
      content: string;
      replyToId?: string | null;
      messageType?: string;
      audioUrl?: string | null;
    }) => {
      // BUG FIX: read coupleId and user inside mutationFn at call time,
      // not from stale closure captured at hook definition time. This prevents
      // the race where coupleId is null during initial render and the insert
      // fires against a null couple_id, or the cache key mismatches.
      const currentCoupleId = couple?.status === "active" ? couple.id : null;
      const currentUser = user;
      if (!currentCoupleId || !currentUser) throw new Error("Not connected");

      // BUG FIX: wrap encryptText in try/catch — if the encryption key is
      // missing or crypto fails, we get a clean error + rollback instead of
      // a silent hang with a stuck optimistic message in the list.
      let encryptedContent: string;
      try {
        encryptedContent = await encryptText(content, currentCoupleId);
      } catch (encErr) {
        console.error("[sendMessage] encryption failed:", encErr);
        throw new Error("Failed to encrypt message — please try again");
      }

      const payload: Record<string, unknown> = {
        sender_id: currentUser.id,
        couple_id: currentCoupleId,
        content: encryptedContent,
        reply_to_id: replyToId ?? null,
        message_type: messageType,
      };
      if (audioUrl) payload.audio_url = audioUrl;

      const { data, error } = await supabase
        .from("messages" as never)
        .insert(payload as never)
        .select("id, sender_id, couple_id, content, created_at, read_at, reply_to_id, message_type, audio_url")
        .single() as unknown as { data: Message | null; error: unknown };

      if (error) throw error;

      // Best-effort push notification — non-blocking, never throws
      try {
        const notifBody = messageType === "voice"
          ? "🎤 Sent a voice message"
          : messageType === "drawing"
            ? "🎨 Sent a drawing"
            : content.length > 80 ? content.slice(0, 80) + "…" : content;
        pushToPartner("💬 New Message", notifBody, "/dashboard/chat");
      } catch { /* ignore push failures */ }

      return data!;
    },

    // Optimistic update — message appears instantly before DB confirms.
    // BUG FIX: snapshot coupleId and user.id at onMutate time (same pattern
    // as mutationFn) so the cache key written here always matches the key
    // the query is stored under.
    onMutate: async ({ content, replyToId, messageType = "text", audioUrl }) => {
      const currentCoupleId = couple?.status === "active" ? couple.id : null;
      const currentUserId = user?.id;
      if (!currentCoupleId || !currentUserId) return;

      const currentQKey = ["messages", currentCoupleId] as const;
      await queryClient.cancelQueries({ queryKey: currentQKey });

      const optimisticMsg: Message = {
        id: `optimistic-${Date.now()}`,
        couple_id: currentCoupleId,
        sender_id: currentUserId,
        content,                          // plain text for immediate display
        created_at: new Date().toISOString(),
        read_at: null,
        reply_to_id: replyToId ?? null,
        message_type: messageType,
        audio_url: audioUrl ?? null,
        reactions: [],
      };

      queryClient.setQueryData<Message[]>(currentQKey, prev => [
        ...(prev ?? []),
        optimisticMsg,
      ]);

      return { optimisticId: optimisticMsg.id, qKey: currentQKey };
    },

    // Swap optimistic placeholder for the real DB row
    onSuccess: (realMsg, _vars, ctx) => {
      if (!ctx?.optimisticId) return;
      const key = ctx.qKey ?? qKey;
      queryClient.setQueryData<Message[]>(key, prev =>
        prev?.map(m =>
          m.id === ctx.optimisticId
            ? {
              ...realMsg,
              // Keep plain-text content — encrypted content from DB is garbled
              content: m.content,
              reactions: [],
            }
            : m
        ) ?? []
      );
    },

    // Roll back on failure
    onError: (_err, _vars, ctx) => {
      if (!ctx?.optimisticId) return;
      const key = ctx?.qKey ?? qKey;
      queryClient.setQueryData<Message[]>(key, prev =>
        prev?.filter(m => m.id !== ctx.optimisticId) ?? []
      );
    },
  });

  // ── Delete message ─────────────────────────────────────────────────────────
  // FIX: soft delete — set deleted_at instead of physically removing the row.
  // Soft delete hides the message from the UI while keeping the row available
  // for audit/history purposes.
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages" as never)
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id", messageId)
        // Only allow deleting your own messages
        .eq("sender_id", user!.id) as unknown as { error: unknown };
      if (error) throw error;
    },

    // Optimistic removal — message disappears from UI immediately
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<Message[]>(qKey);
      queryClient.setQueryData<Message[]>(qKey, msgs =>
        msgs?.filter(m => m.id !== messageId) ?? []
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    // No onSuccess needed — DELETE realtime event handles cache cleanup
  });

  // ── Add reaction ───────────────────────────────────────────────────────────
  const addReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("message_reactions" as never)
        .insert({ message_id: messageId, user_id: user.id, emoji } as never) as unknown as {
          error: { code?: string } | null;
        };
      // 23505 = unique violation (already reacted with this emoji) — safe to ignore
      if (error && error.code !== "23505") throw error;
    },

    // FIX: optimistic reaction — emoji appears instantly
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<Message[]>(qKey);

      const optimisticReaction: MessageReaction = {
        id: `optimistic-${Date.now()}`,
        message_id: messageId,
        user_id: user!.id,
        emoji,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(qKey, msgs =>
        msgs?.map(m =>
          m.id !== messageId ? m : {
            ...m,
            reactions: [...(m.reactions ?? []), optimisticReaction],
          }
        ) ?? []
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    // handleReactionChange will invalidate and sync the real reaction from DB
  });

  // ── Remove reaction ────────────────────────────────────────────────────────
  const removeReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("message_reactions" as never)
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji) as unknown as { error: unknown };
      if (error) throw error;
    },

    // FIX: optimistic removal
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<Message[]>(qKey);

      queryClient.setQueryData<Message[]>(qKey, msgs =>
        msgs?.map(m =>
          m.id !== messageId ? m : {
            ...m,
            reactions: m.reactions?.filter(
              r => !(r.user_id === user!.id && r.emoji === emoji)
            ) ?? [],
          }
        ) ?? []
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
  });

  return {
    ...query,
    sendMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    coupleId,
  };
}
