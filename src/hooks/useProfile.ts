import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useAllProfiles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ displayName, avatarUrl }: { displayName?: string; avatarUrl?: string }) => {
      const update: Record<string, string> = {};
      if (displayName !== undefined) update.display_name = displayName;
      if (avatarUrl !== undefined) update.avatar_url = avatarUrl;
      const { error } = await supabase
        .from("profiles")
        .update(update)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profiles-all"] });
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Bust cache by appending timestamp
      return data.publicUrl + `?t=${Date.now()}`;
    },
  });
}

export function useStorageUsage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["storage-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("file_size");
      if (error) throw error;
      const total = (data ?? []).reduce((sum, m) => sum + (m.file_size ?? 0), 0);
      return total;
    },
    enabled: !!user,
  });
}
