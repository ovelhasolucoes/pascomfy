import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useAuth } from "@/contexts/AuthContext";

export const useEventMembers = (eventId?: string) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addMember = useMutation({
    mutationFn: async (params: { eventTeamId: string; userId: string; roleName?: string; roleDescription?: string }) => {
      if (!profile) throw new Error("No profile");
      const { data, error } = await supabase
        .from("event_team_members")
        .insert({
          event_team_id: params.eventTeamId,
          user_id: params.userId,
          company_id: profile.company_id,
          role_name: params.roleName || null,
          role_description: params.roleDescription || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_teams", eventId] }),
  });

  const updateMember = useMutation({
    mutationFn: async (params: { id: string; roleName?: string; status?: string }) => {
      const updates: Record<string, unknown> = {};
      if (params.roleName !== undefined) updates.role_name = params.roleName;
      if (params.status !== undefined) {
        updates.status = params.status;
        if (params.status === "confirmado") updates.confirmed_at = new Date().toISOString();
      }
      const { error } = await supabase.from("event_team_members").update(updates).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_teams", eventId] }),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_teams", eventId] }),
  });

  const confirmPresence = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("event_team_members")
        .update({ status: "confirmado", confirmed_at: new Date().toISOString() })
        .eq("id", memberId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_teams"] });
      queryClient.invalidateQueries({ queryKey: ["my_schedule"] });
    },
  });

  return { addMember, updateMember, removeMember, confirmPresence };
};
