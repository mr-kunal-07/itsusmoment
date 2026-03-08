import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { QK } from "@/lib/queryKeys";

export type Folder = Tables<"folders">;

export function useFolders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.folders(),
    queryFn: async () => {
      const { data, error } = await supabase.from("folders").select("*").order("name");
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string | null }) => {
      const { data, error } = await supabase
        .from("folders")
        .insert({ name, parent_id: parentId ?? null, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.folders() }),
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("folders").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.folders() }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.folders() });
      qc.invalidateQueries({ queryKey: QK.mediaAll() });
    },
  });
}
