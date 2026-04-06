import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useAuth } from "@/contexts/AuthContext";

export const useChecklistProgress = (eventId?: string) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const toggleItem = useMutation({
    mutationFn: async (params: { itemId: string; currentProgressId?: string; currentStatus?: string }) => {
      if (!profile || !user) throw new Error("Not authenticated");

      const isCompleted = params.currentStatus === "concluido";

      if (params.currentProgressId) {
        // Update existing progress
        const { error } = await supabase
          .from("event_checklist_progress")
          .update({
            status: isCompleted ? "pendente" : "concluido",
            completed_at: isCompleted ? null : new Date().toISOString(),
          })
          .eq("id", params.currentProgressId);
        if (error) throw error;
      } else {
        // Insert new progress
        const { error } = await supabase
          .from("event_checklist_progress")
          .insert({
            event_checklist_item_id: params.itemId,
            user_id: user.id,
            company_id: profile.company_id,
            status: "concluido",
            completed_at: new Date().toISOString(),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_checklists", eventId] });
    },
  });

  return { toggleItem };
};
