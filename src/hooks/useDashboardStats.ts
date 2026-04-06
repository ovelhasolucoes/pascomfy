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

  // Attendance chart data — last 6 months
  const attendanceChart = useQuery({
    queryKey: ["dashboard_attendance_chart", companyId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("event_attendance")
        .select("checkin_at, status")
        .eq("company_id", companyId!)
        .gte("checkin_at", sixMonthsAgo.toISOString());
      if (error) throw error;

      const months: Record<string, { presente: number; ausente: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months[key] = { presente: 0, ausente: 0 };
      }

      (data ?? []).forEach((r) => {
        if (!r.checkin_at) return;
        const d = new Date(r.checkin_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (months[key]) {
          if (r.status === "presente") months[key].presente++;
          else months[key].ausente++;
        }
      });

      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return Object.entries(months).map(([key, val]) => ({
        month: monthNames[parseInt(key.split("-")[1]) - 1],
        presente: val.presente,
        ausente: val.ausente,
      }));
    },
    enabled: !!companyId,
  });

  // Top performers
  const topPerformers = useQuery({
    queryKey: ["dashboard_top_performers", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendance")
        .select("user_id, profiles!event_attendance_user_id_fkey(name, avatar_url)")
        .eq("company_id", companyId!)
        .eq("status", "presente");
      if (error) throw error;

      const map = new Map<string, { name: string; avatar_url: string | null; count: number }>();
      (data ?? []).forEach((r: any) => {
        const e = map.get(r.user_id);
        if (e) e.count++;
        else map.set(r.user_id, { name: r.profiles?.name ?? "?", avatar_url: r.profiles?.avatar_url, count: 1 });
      });

      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    },
    enabled: !!companyId,
  });

  // Top absences
  const topAbsences = useQuery({
    queryKey: ["dashboard_top_absences", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_team_members")
        .select("user_id, profiles!event_team_members_user_id_fkey(name, avatar_url)")
        .eq("company_id", companyId!)
        .eq("status", "ausente");
      if (error) throw error;

      const map = new Map<string, { name: string; avatar_url: string | null; count: number }>();
      (data ?? []).forEach((r: any) => {
        const e = map.get(r.user_id);
        if (e) e.count++;
        else map.set(r.user_id, { name: r.profiles?.name ?? "?", avatar_url: r.profiles?.avatar_url, count: 1 });
      });

      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    },
    enabled: !!companyId,
  });

  return {
    upcomingEvents: upcomingEvents.data ?? [],
    pendingChecklists: pendingChecklists.data ?? [],
    totalUsers: totalUsers.data ?? 0,
    eventsThisMonth: eventsThisMonth.data ?? 0,
    pendingSubstitutions: pendingSubstitutions.data ?? 0,
    attendanceChart: attendanceChart.data ?? [],
    topPerformers: topPerformers.data ?? [],
    topAbsences: topAbsences.data ?? [],
    loading: upcomingEvents.isLoading,
  };
};
