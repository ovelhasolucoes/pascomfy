import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export const useTeamTemplates = () => {
  const { profile } = useProfile();

  const query = useQuery({
    queryKey: ["team_templates", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_templates")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  return { templates: query.data ?? [], loading: query.isLoading };
};
