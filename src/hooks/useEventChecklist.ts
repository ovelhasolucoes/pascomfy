import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  display_order: number;
  scope: string;
  event_checklist_id: string;
  progress: {
    id: string;
    status: string;
    user_id: string;
    completed_at: string | null;
    user_name?: string;
  } | null;
}

export interface EventChecklist {
  id: string;
  name: string;
  event_team_id: string | null;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export const useEventChecklist = (eventId?: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["event_checklists", eventId, user?.id],
    queryFn: async () => {
      // Fetch checklists for event
      const { data: checklists, error: clErr } = await supabase
        .from("event_checklists")
        .select("id, name, event_team_id")
        .eq("event_id", eventId!);
      if (clErr) throw clErr;
      if (!checklists?.length) return [] as EventChecklist[];

      const checklistIds = checklists.map((c) => c.id);

      // Fetch items
      const { data: items, error: itErr } = await supabase
        .from("event_checklist_items")
        .select("id, title, description, is_required, display_order, scope, event_checklist_id")
        .in("event_checklist_id", checklistIds)
        .order("display_order", { ascending: true });
      if (itErr) throw itErr;

      const itemIds = (items || []).map((i) => i.id);

      // Fetch progress
      let progressData: any[] = [];
      if (itemIds.length > 0) {
        const { data: progress, error: prErr } = await supabase
          .from("event_checklist_progress")
          .select("id, status, user_id, completed_at, event_checklist_item_id")
          .in("event_checklist_item_id", itemIds);
        if (prErr) throw prErr;
        progressData = progress || [];
      }

      // Fetch profile names for completed items
      const completedUserIds = [...new Set(progressData.filter((p) => p.status === "concluido").map((p) => p.user_id))];
      let profileMap: Record<string, string> = {};
      if (completedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", completedUserIds);
        profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
      }

      // Map to structured data
      return checklists.map((cl) => {
        const clItems = (items || [])
          .filter((i) => i.event_checklist_id === cl.id)
          .map((item) => {
            // For individual scope: only show user's progress
            // For shared scope: show any progress
            const matchingProgress = progressData.filter(
              (p) => p.event_checklist_item_id === item.id
            );
            let progress: ChecklistItem["progress"] = null;

            if (item.scope === "individual") {
              const userProgress = matchingProgress.find((p) => p.user_id === user!.id);
              if (userProgress) {
                progress = {
                  id: userProgress.id,
                  status: userProgress.status,
                  user_id: userProgress.user_id,
                  completed_at: userProgress.completed_at,
                };
              }
            } else {
              const anyCompleted = matchingProgress.find((p) => p.status === "concluido");
              if (anyCompleted) {
                progress = {
                  id: anyCompleted.id,
                  status: anyCompleted.status,
                  user_id: anyCompleted.user_id,
                  completed_at: anyCompleted.completed_at,
                  user_name: profileMap[anyCompleted.user_id],
                };
              }
            }

            return { ...item, progress } as ChecklistItem;
          });

        const completedCount = clItems.filter((i) => i.progress?.status === "concluido").length;
        const totalCount = clItems.length;

        return {
          id: cl.id,
          name: cl.name,
          event_team_id: cl.event_team_id,
          items: clItems,
          completedCount,
          totalCount,
          percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        } as EventChecklist;
      });
    },
    enabled: !!eventId && !!user,
  });

  return { checklists: query.data ?? [], loading: query.isLoading, refetch: query.refetch };
};
