import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type TeamWithMembers = Tables<"event_teams"> & {
  event_team_members: (Tables<"event_team_members"> & { profiles: Tables<"profiles"> })[];
};

export const useEventTeams = (eventId?: string) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: ["event_teams", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_teams")
        .select("*, event_team_members(*, profiles(*))")
        .eq("event_id", eventId!)
        .order("display_order");
      if (error) throw error;
      return data as TeamWithMembers[];
    },
    enabled: !!eventId && !!profile,
  });

  const createTeam = useMutation({
    mutationFn: async (team: Omit<TablesInsert<"event_teams">, "company_id">) => {
      if (!profile) throw new Error("No profile");
      const { data, error } = await supabase
        .from("event_teams")
        .insert({ ...team, company_id: profile.company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_teams", eventId] }),
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from("event_teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_teams", eventId] }),
  });

  return { teams: teamsQuery.data ?? [], loading: teamsQuery.isLoading, createTeam, deleteTeam };
};
