import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ActivityType = "upload" | "note" | "reaction" | "milestone";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  created_at: string;
  actor_id: string;
  // upload
  media_id?: string;
  media_title?: string;
  media_file_type?: string;
  media_file_path?: string;
  // note
  note_content?: string;
  // reaction
  emoji?: string;
  // milestone
  milestone_title?: string;
  milestone_type?: string;
}

export function useActivityFeed() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["activity-feed"],
    queryFn: async () => {
      const [mediaRes, notesRes, reactionsRes, milestonesRes] = await Promise.all([
        supabase
          .from("media")
          .select("id, title, file_type, file_path, uploaded_by, created_at")
          .order("created_at", { ascending: false })
          .limit(40),
        (supabase as any)
          .from("love_notes")
          .select("id, content, author_id, created_at, media:media_id(id, title, file_type, file_path)")
          .order("created_at", { ascending: false })
          .limit(40),
        (supabase as any)
          .from("media_reactions")
          .select("id, emoji, user_id, created_at, media:media_id(id, title, file_type, file_path)")
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("milestones")
          .select("id, title, type, created_by, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const items: ActivityItem[] = [];

      (mediaRes.data ?? []).forEach((m: any) => {
        items.push({
          id: `upload-${m.id}`,
          type: "upload",
          created_at: m.created_at,
          actor_id: m.uploaded_by,
          media_id: m.id,
          media_title: m.title,
          media_file_type: m.file_type,
          media_file_path: m.file_path,
        });
      });

      (notesRes.data ?? []).forEach((n: any) => {
        items.push({
          id: `note-${n.id}`,
          type: "note",
          created_at: n.created_at,
          actor_id: n.author_id,
          media_id: n.media?.id,
          media_title: n.media?.title,
          media_file_type: n.media?.file_type,
          media_file_path: n.media?.file_path,
          note_content: n.content,
        });
      });

      (reactionsRes.data ?? []).forEach((r: any) => {
        items.push({
          id: `reaction-${r.id}`,
          type: "reaction",
          created_at: r.created_at,
          actor_id: r.user_id,
          media_id: r.media?.id,
          media_title: r.media?.title,
          media_file_type: r.media?.file_type,
          media_file_path: r.media?.file_path,
          emoji: r.emoji,
        });
      });

      (milestonesRes.data ?? []).forEach((m: any) => {
        items.push({
          id: `milestone-${m.id}`,
          type: "milestone",
          created_at: m.created_at,
          actor_id: m.created_by,
          milestone_title: m.title,
          milestone_type: m.type,
        });
      });

      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
