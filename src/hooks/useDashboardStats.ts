import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export const useDashboardStats = () => {
  const { profile } = useProfile();
  const companyId = profile?.company_id;

  const upcomingEvents = useQuery({
    queryKey: ["dashboard_upcoming_events", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_date, location, event_types(name, color)")
        .eq("company_id", companyId!)
        .eq("status", "ativo")
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const pendingChecklists = useQuery({
    queryKey: ["dashboard_pending_checklists", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_checklist_progress")
        .select("id, event_checklist_items(title, event_checklists(events(title)))")
        .eq("user_id", profile!.id)
        .eq("status", "pendente")
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  // Admin stats
  const totalUsers = useQuery({
    queryKey: ["dashboard_total_users", companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!)
        .eq("status", "ativo");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!companyId,
  });

  const eventsThisMonth = useQuery({
    queryKey: ["dashboard_events_month", companyId],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const { count, error } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!)
        .gte("start_date", start)
        .lte("start_date", end);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!companyId,
  });

  const pendingSubstitutions = useQuery({
    queryKey: ["dashboard_pending_subs", companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_substitutions")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId!)
        .eq("status", "pendente");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!companyId,
  });

  return {
    upcomingEvents: upcomingEvents.data ?? [],
    pendingChecklists: pendingChecklists.data ?? [],
    totalUsers: totalUsers.data ?? 0,
    eventsThisMonth: eventsThisMonth.data ?? 0,
    pendingSubstitutions: pendingSubstitutions.data ?? 0,
    loading: upcomingEvents.isLoading,
  };
};
