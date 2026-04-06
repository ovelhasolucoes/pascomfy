import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export const useCompanyMembers = () => {
  const { profile } = useProfile();

  const query = useQuery({
    queryKey: ["company_members", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, status")
        .eq("company_id", profile.company_id)
        .eq("status", "ativo")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  return { members: query.data ?? [], loading: query.isLoading };
};
