import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QK } from "@/lib/queryKeys";

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string | null;
  invite_code: string;
  status: "pending" | "active";
  created_at: string;
  updated_at: string;
}

export function useMyCouple() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QK.myCouple(),
    staleTime: 5 * 60_000, // couple data changes rarely
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples")
        .select("*")
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .maybeSingle();
      if (error) throw error;
      return data as Couple | null;
    },
    enabled: !!user,
  });

  // Realtime — refresh when couple row changes (partner accepts invite)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`couple:${user.id}`) // scoped per user to avoid broadcast storms
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "couples",
        filter: `user1_id=eq.${user.id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: QK.myCouple() });
        qc.invalidateQueries({ queryKey: QK.mediaAll() });
        qc.invalidateQueries({ queryKey: QK.folders() });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  return query;
}

/** Create a pending invite (user1 generates invite code) */
export function useCreateInvite() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      // Check not already in a couple
      const { data: existing } = await supabase
        .from("couples")
        .select("id")
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .maybeSingle();
      if (existing) throw new Error("You already have a couple link");

      const { data, error } = await supabase
        .from("couples")
        .insert({ user1_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Couple;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.myCouple() }),
  });
}

/** Accept partner's invite code */
export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("accept_couple_invite", {
        _invite_code: code.trim().toUpperCase(),
      });
      if (error) throw error;
      const result = data as { error?: string; success?: boolean };
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.myCouple() });
      qc.invalidateQueries({ queryKey: QK.mediaAll() });
      qc.invalidateQueries({ queryKey: QK.folders() });
    },
  });
}

/** Unlink partner (delete the couple record) */
export function useUnlinkPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupleId: string) => {
      const { error } = await supabase.from("couples").delete().eq("id", coupleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.myCouple() });
      qc.invalidateQueries({ queryKey: QK.mediaAll() });
    },
  });
}
