import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export const useRealtimeChecklist = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  useEffect(() => {
    if (!eventId || !profile?.company_id) return;

    const channel = supabase
      .channel(`event-live-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_checklist_progress",
          filter: `company_id=eq.${profile.company_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["event_checklists", eventId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_attendance",
          filter: `company_id=eq.${profile.company_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["event_attendance", eventId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, profile?.company_id, queryClient]);
};
