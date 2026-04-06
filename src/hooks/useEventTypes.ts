import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export const useEventTypes = () => {
  const { profile } = useProfile();

  const query = useQuery({
    queryKey: ["event_types", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  return { eventTypes: query.data ?? [], loading: query.isLoading };
};
