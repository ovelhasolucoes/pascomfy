import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaaSStats {
  activeCompanies: number;
  totalUsers: number;
  mrr: number;
  openTickets: number;
  companiesThisMonth: number;
  companiesLastMonth: number;
}

export const useSuperAdminStats = () => {
  return useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async (): Promise<SaaSStats> => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [companiesRes, usersRes, subsRes, ticketsRes, thisMonthRes, lastMonthRes] =
        await Promise.all([
          supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "ativa"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("subscriptions").select("plan_id, plans(price_monthly)").eq("status", "ativo"),
          supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "aberto"),
          supabase.from("companies").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth),
          supabase.from("companies").select("id", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lt("created_at", startOfMonth),
        ]);

      const mrr = (subsRes.data || []).reduce((sum, s: any) => sum + (Number(s.plans?.price_monthly) || 0), 0);

      return {
        activeCompanies: companiesRes.count || 0,
        totalUsers: usersRes.count || 0,
        mrr,
        openTickets: ticketsRes.count || 0,
        companiesThisMonth: thisMonthRes.count || 0,
        companiesLastMonth: lastMonthRes.count || 0,
      };
    },
  });
};

export const useSuperAdminCompanies = () => {
  return useQuery({
    queryKey: ["superadmin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, subscriptions(id, status, plan_id, plans(name, price_monthly))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useSuperAdminPlans = () => {
  return useQuery({
    queryKey: ["superadmin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};
