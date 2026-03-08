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
  created_at: string;
}

const QK_BUCKET = () => ["bucket-list"] as const;

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

export function useAddBucketItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: couple } = useMyCouple();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!couple?.id || couple.status !== "active") throw new Error("No active couple");
      const { error } = await (supabase as any)
        .from("bucket_list")
        .insert({ couple_id: couple.id, added_by: user!.id, text: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_BUCKET() }),
  });
}

export function useToggleBucketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await (supabase as any)
        .from("bucket_list")
        .update({ done })
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
