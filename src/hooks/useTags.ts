import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface MediaTag {
  id: string;
  media_id: string;
  tag_id: string;
  created_by: string;
  created_at: string;
  tag?: Tag;
}

export const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
  "#14b8a6", "#84cc16",
];

export function useTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tags")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useMediaTags(mediaId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["media-tags", mediaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("media_tags")
        .select("*, tag:tag_id(*)")
        .eq("media_id", mediaId);
      if (error) throw error;
      return data as MediaTag[];
    },
    enabled: !!user && !!mediaId,
  });
}

export function useAllMediaTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["media-tags-all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("media_tags")
        .select("*, tag:tag_id(*)");
      if (error) throw error;
      return data as MediaTag[];
    },
    enabled: !!user,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await (supabase as any)
        .from("tags")
        .insert({ name: name.trim(), color, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["media-tags"] });
      qc.invalidateQueries({ queryKey: ["media-tags-all"] });
    },
  });
}

export function useAddTagToMedia() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ mediaId, tagId }: { mediaId: string; tagId: string }) => {
      const { error } = await (supabase as any)
        .from("media_tags")
        .insert({ media_id: mediaId, tag_id: tagId, created_by: user!.id });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["media-tags", vars.mediaId] });
      qc.invalidateQueries({ queryKey: ["media-tags-all"] });
    },
  });
}

export function useRemoveTagFromMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, tagId }: { mediaId: string; tagId: string }) => {
      const { error } = await (supabase as any)
        .from("media_tags")
        .delete()
        .eq("media_id", mediaId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["media-tags", vars.mediaId] });
      qc.invalidateQueries({ queryKey: ["media-tags-all"] });
    },
  });
}
