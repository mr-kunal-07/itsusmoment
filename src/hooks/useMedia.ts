import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

export type Media = Tables<"media"> & { uploader_name?: string | null; taken_at?: string | null; deleted_at?: string | null };

export function useMedia(folderId?: string | null, search?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["media", folderId, search],
    queryFn: async () => {
      let query = supabase.from("media").select("*").is("deleted_at", null);
      if (folderId !== undefined) {
        if (folderId) query = query.eq("folder_id", folderId);
        else query = query.is("folder_id", null);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
    enabled: !!user,
  });
}

export function useRecentlyDeletedMedia() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["media", "recently-deleted"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .not("deleted_at", "is", null)
        .gt("deleted_at", cutoff)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
    enabled: !!user,
  });
}

export function useStarredMedia() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["media", "starred"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("is_starred", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Media[];
    },
    enabled: !!user,
  });
}

async function extractTakenAt(file: File): Promise<string | null> {
  try {
    if (!file.type.startsWith("image/")) return null;
    const exifr = (await import("exifr")).default;
    const result = await exifr.parse(file, ["DateTimeOriginal", "CreateDate", "DateTime"]);
    const raw = result?.DateTimeOriginal ?? result?.CreateDate ?? result?.DateTime;
    if (!raw) return null;
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw.toISOString();
    return null;
  } catch {
    return null;
  }
}

export function useUploadMedia() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, title, description, folderId }: { file: File; title: string; description?: string; folderId?: string | null }) => {
      const ext = file.name.split(".").pop();
      const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      const takenAt = await extractTakenAt(file);

      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file);
      if (uploadError) throw uploadError;

      const fileType = file.type.startsWith("video/") ? "video" : "image";

      const { data, error: dbError } = await supabase.from("media").insert({
        title,
        description: description || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileType,
        mime_type: file.type,
        folder_id: folderId ?? null,
        uploaded_by: user!.id,
        ...(takenAt ? { taken_at: takenAt } : {}),
      } as never).select().single();
      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description?: string }) => {
      const { error } = await supabase.from("media").update({ title, description: description || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

export function useBackfillExifDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; file_path: string }[]) => {
      const exifr = (await import("exifr")).default;
      const results: { id: string; taken_at: string }[] = [];

      for (const item of items) {
        try {
          const { data: urlData } = supabase.storage.from("media").getPublicUrl(item.file_path);
          const parsed = await exifr.parse(urlData.publicUrl, ["DateTimeOriginal", "CreateDate", "DateTime"]);
          const raw = parsed?.DateTimeOriginal ?? parsed?.CreateDate ?? parsed?.DateTime;
          if (raw instanceof Date && !isNaN(raw.getTime())) {
            results.push({ id: item.id, taken_at: raw.toISOString() });
          }
        } catch {
          // skip files without EXIF
        }
      }

      for (let i = 0; i < results.length; i += 5) {
        const batch = results.slice(i, i + 5);
        await Promise.all(
          batch.map(r => supabase.from("media").update({ taken_at: r.taken_at } as never).eq("id", r.id))
        );
      }
      return results.length;
    },
    onSuccess: (count) => {
      if (count > 0) {
        qc.invalidateQueries({ queryKey: ["memories-timeline"] });
        qc.invalidateQueries({ queryKey: ["media"] });
      }
    },
  });
}

/** Soft-delete: sets deleted_at instead of permanently removing */
export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; filePath: string }) => {
      const { error } = await supabase
        .from("media")
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

/** Restore a soft-deleted media item */
export function useRestoreMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("media")
        .update({ deleted_at: null } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

/** Permanently delete (used by purge cron and manual permanent delete from trash) */
export function usePermanentDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from("media").remove([filePath]);
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useMoveMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const { error } = await supabase.from("media").update({ folder_id: folderId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

export function useBulkDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; filePath: string }[]) => {
      const ids = items.map(i => i.id);
      const { error } = await supabase
        .from("media")
        .update({ deleted_at: new Date().toISOString() } as never)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

export function useBulkMoveMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string | null }) => {
      const { error } = await supabase.from("media").update({ folder_id: folderId }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

export function useToggleStar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: boolean }) => {
      const { error } = await supabase.from("media").update({ is_starred: starred }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["media-infinite"] });
    },
  });
}

export function getPublicUrl(filePath: string) {
  const { data } = supabase.storage.from("media").getPublicUrl(filePath);
  return data.publicUrl;
}
