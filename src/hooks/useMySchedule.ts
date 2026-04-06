import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMySchedule = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["my_schedule", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_team_members")
        .select(`
          id, status, role_name, confirmed_at,
          event_teams!inner(
            id, name, color,
            events!inner(id, title, start_date, end_date, location, status, event_types(*))
          )
        `)
        .eq("user_id", user!.id)
        .eq("event_teams.events.status", "ativo")
        .gte("event_teams.events.start_date", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return { schedule: query.data ?? [], loading: query.isLoading };
};
