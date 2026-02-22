import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

export type Media = Tables<"media"> & { uploader_name?: string | null };

export function useMedia(folderId?: string | null, search?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["media", folderId, search],
    queryFn: async () => {
      let query = supabase.from("media").select("*");
      if (folderId) {
        query = query.eq("folder_id", folderId);
      } else if (folderId === null) {
        query = query.is("folder_id", null);
      }
      if (search) {
        query = query.ilike("title", `%${search}%`);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
    enabled: !!user,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, title, description, folderId }: { file: File; title: string; description?: string; folderId?: string | null }) => {
      const ext = file.name.split(".").pop();
      const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file);
      if (uploadError) throw uploadError;

      const fileType = file.type.startsWith("video/") ? "video" : "image";

      const { error: dbError } = await supabase.from("media").insert({
        title,
        description: description || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileType,
        mime_type: file.type,
        folder_id: folderId ?? null,
        uploaded_by: user!.id,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description?: string }) => {
      const { error } = await supabase.from("media").update({ title, description: description || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from("media").remove([filePath]);
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function useMoveMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const { error } = await supabase.from("media").update({ folder_id: folderId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media"] }),
  });
}

export function getPublicUrl(filePath: string) {
  const { data } = supabase.storage.from("media").getPublicUrl(filePath);
  return data.publicUrl;
}
