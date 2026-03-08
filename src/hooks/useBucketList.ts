import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyCouple } from "@/hooks/useCouple";

export interface BucketListItem {
  id: string;
  couple_id: string;
  added_by: string;
  text: string;
  done: boolean;
  category: string;
  due_date: string | null;
  completed_at: string | null;
  completed_photo_url: string | null;
  note: string | null;
  created_at: string;
}

export interface BucketListReaction {
  id: string;
  item_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

const QK_BUCKET = () => ["bucket-list"] as const;
const QK_REACTIONS = (itemId?: string) => ["bucket-list-reactions", itemId] as const;

export function useBucketList() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const coupleId = couple?.status === "active" ? couple.id : null;

  return useQuery({
    queryKey: QK_BUCKET(),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bucket_list")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BucketListItem[];
    },
    enabled: !!user && !!coupleId,
  });
}

export function useBucketListReactions() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();
  const coupleId = couple?.status === "active" ? couple.id : null;

  return useQuery({
    queryKey: QK_REACTIONS(),
    queryFn: async () => {
      // Get all item IDs for this couple first
      const { data: items } = await (supabase as any)
        .from("bucket_list")
        .select("id")
        .eq("couple_id", coupleId);
      if (!items?.length) return [] as BucketListReaction[];

      const ids = items.map((i: any) => i.id);
      const { data, error } = await (supabase as any)
        .from("bucket_list_reactions")
        .select("*")
        .in("item_id", ids);
      if (error) throw error;
      return data as BucketListReaction[];
    },
    enabled: !!user && !!coupleId,
  });
}

export function useAddBucketItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: couple } = useMyCouple();

  return useMutation({
    mutationFn: async ({ text, category, due_date }: { text: string; category?: string; due_date?: string | null }) => {
      if (!couple?.id || couple.status !== "active") throw new Error("No active couple");
      const { error } = await (supabase as any)
        .from("bucket_list")
        .insert({
          couple_id: couple.id,
          added_by: user!.id,
          text: text.trim(),
          category: category ?? "other",
          due_date: due_date ?? null,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_BUCKET() }),
  });
}

export function useToggleBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done, completed_photo_url }: { id: string; done: boolean; completed_photo_url?: string }) => {
      const { error } = await (supabase as any)
        .from("bucket_list")
        .update({
          done,
          completed_at: done ? new Date().toISOString() : null,
          completed_photo_url: done ? (completed_photo_url ?? null) : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_BUCKET() }),
  });
}

export function useUpdateBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; due_date?: string | null; category?: string; note?: string }) => {
      const { error } = await (supabase as any)
        .from("bucket_list")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_BUCKET() }),
  });
}

export function useDeleteBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("bucket_list")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_BUCKET() }),
  });
}

export function useToggleBucketReaction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ item_id, emoji, hasReacted }: { item_id: string; emoji: string; hasReacted: boolean }) => {
      if (hasReacted) {
        const { error } = await (supabase as any)
          .from("bucket_list_reactions")
          .delete()
          .eq("item_id", item_id)
          .eq("user_id", user!.id)
          .eq("emoji", emoji);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("bucket_list_reactions")
          .insert({ item_id, user_id: user!.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_REACTIONS() }),
  });
}
