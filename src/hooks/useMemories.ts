import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Media } from "@/hooks/useMedia";

/** Returns media uploaded on today's date (any year) */
export function useOnThisDay() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["on-this-day"],
    queryFn: async () => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      // Match MM-DD across all years using ilike
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .like("created_at", `%-${month}-${day}%`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Exclude current year
      const currentYear = now.getFullYear();
      return (data as Media[]).filter(
        m => new Date(m.created_at).getFullYear() < currentYear
      );
    },
    enabled: !!user,
  });
}

/** Returns all media grouped by month-year */
export function useMemoriesTimeline() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memories-timeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Group by YYYY-MM
      const groups: Record<string, Media[]> = {};
      (data as Media[]).forEach(m => {
        const d = new Date(m.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });
      return groups;
    },
    enabled: !!user,
  });
}

/** Returns aggregate relationship stats */
export function useRelationshipStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["relationship-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id, file_type, file_size, created_at, is_starred, uploaded_by");
      if (error) throw error;
      const all = data ?? [];
      const total = all.length;
      const images = all.filter(m => m.file_type === "image").length;
      const videos = all.filter(m => m.file_type === "video").length;
      const starred = all.filter(m => m.is_starred).length;
      const totalSize = all.reduce((s, m) => s + (m.file_size ?? 0), 0);
      const firstMedia = all.length
        ? all.reduce((a, b) => new Date(a.created_at) < new Date(b.created_at) ? a : b)
        : null;
      const firstDate = firstMedia ? new Date(firstMedia.created_at) : null;
      const daysTogether = firstDate
        ? Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return { total, images, videos, starred, totalSize, firstDate, daysTogether };
    },
    enabled: !!user,
  });
}
