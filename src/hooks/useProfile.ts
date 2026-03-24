import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { QK } from "@/lib/queryKeys";
import { useMyCouple } from "@/hooks/useCouple";

export type Profile = Tables<"profiles">;

// ─────────────────────────────────────────────────────────────
// 🔹 Helper: Build profile from auth user
// ─────────────────────────────────────────────────────────────
function buildProfileFromUser(user: any) {
  return {
    user_id: user.id,
    display_name:
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User",
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
  };
}

// ─────────────────────────────────────────────────────────────
// 🔹 useProfile (AUTO-CREATE)
// ─────────────────────────────────────────────────────────────
export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: QK.profile(user?.id),
    staleTime: 5 * 60_000,

    queryFn: async () => {
      if (!user) return null;

      // 1. Try fetch
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // 2. If exists → return
      if (data) return data as Profile;

      // 3. If NOT exists → create
      const newProfile = buildProfileFromUser(user);

      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (insertError) throw insertError;

      return inserted as Profile;
    },

    enabled: !!user,
  });
}

// ─────────────────────────────────────────────────────────────
// 🔹 useAllProfiles (optimized)
// ─────────────────────────────────────────────────────────────
export function useAllProfiles() {
  const { user } = useAuth();
  const { data: couple } = useMyCouple();

  const partnerId =
    couple?.status === "active"
      ? couple.user1_id === user?.id
        ? couple.user2_id
        : couple.user1_id
      : null;

  return useQuery({
    queryKey: [...QK.profilesAll(), partnerId],
    staleTime: 5 * 60_000,

    queryFn: async () => {
      if (!user) return [];

      const ids = [user.id];

      if (partnerId) ids.push(partnerId);

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

// ─────────────────────────────────────────────────────────────
// 🔹 useUpdateProfile (UPSERT FIX)
// ─────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      displayName,
      avatarUrl,
    }: {
      displayName?: string;
      avatarUrl?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const payload: any = {
        user_id: user.id,
      };

      if (displayName !== undefined) {
        payload.display_name = displayName;
      }

      if (avatarUrl !== undefined) {
        payload.avatar_url = avatarUrl;
      }

      // 🔥 UPSERT instead of update
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.profile() });
      qc.invalidateQueries({ queryKey: QK.profilesAll() });
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 🔹 useUploadAvatar
// ─────────────────────────────────────────────────────────────
export function useUploadAvatar() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("User not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      return data.publicUrl + `?t=${Date.now()}`;
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 🔹 useStorageUsage
// ─────────────────────────────────────────────────────────────
export function useStorageUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: QK.storageUsage(),
    staleTime: 5 * 60_000,

    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("file_size")
        .is("deleted_at", null);

      if (error) throw error;

      return (data ?? []).reduce(
        (sum, m) => sum + (m.file_size ?? 0),
        0
      );
    },

    enabled: !!user,
  });
}