import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface AutomationLog {
  id: string;
  company_id: string;
  automation_id: string | null;
  queue_item_id: string | null;
  user_id: string;
  channel: string;
  status: string;
  message: string;
  gateway_response: string | null;
  created_at: string;
}

interface Filters {
  channel?: string;
  status?: string;
}

export function useAutomationLogs(filters?: Filters) {
  const { profile } = useProfile();
  const companyId = profile?.company_id;

  const query = useQuery({
    queryKey: ["automation_logs", companyId, filters],
    queryFn: async () => {
      let q = supabase
        .from("automation_logs")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.channel) q = q.eq("channel", filters.channel);
      if (filters?.status) q = q.eq("status", filters.status);

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as AutomationLog[];
    },
    enabled: !!companyId,
  });

  return { logs: query.data ?? [], loading: query.isLoading };
}
