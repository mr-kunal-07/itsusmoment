import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { QK } from "@/lib/queryKeys";
import { useMyCouple } from "@/hooks/useCouple";

export type Profile = Tables<"profiles">;

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.profile(user?.id),
    staleTime: 5 * 60_000, // profile changes rarely — 5 min stale
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

/**
 * Only fetches profiles for users in the same couple (own + partner).
 * This avoids a full table scan at 100K users scale.
 */
export function useAllProfiles() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();

  // Include couple IDs in the query key so we refetch when partner links
  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;

  return useQuery({
    queryKey: [...QK.profilesAll(), partnerId],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Build list of relevant user IDs
      const ids: string[] = [user!.id];
      if (couple?.user1_id && couple.user1_id !== user!.id) ids.push(couple.user1_id);
      if (couple?.user2_id && couple.user2_id !== user!.id) ids.push(couple.user2_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ids);
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
      const { error } = await supabase.from("profiles").update(update).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.profile() });
      qc.invalidateQueries({ queryKey: QK.profilesAll() });
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

/**
 * Combined storage usage for the couple (both partners' media summed).
 * The media RLS already returns files from both users when linked,
 * so a single aggregate query covers the shared pool.
 */
export function useStorageUsage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.storageUsage(),
    staleTime: 5 * 60_000, // storage doesn't change frequently
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("file_size")
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []).reduce((sum, m) => sum + (m.file_size ?? 0), 0);
    },
    enabled: !!user,
  });
}
