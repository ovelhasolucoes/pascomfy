import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { MetricCard } from "@/components/superadmin/MetricCard";
import { useSuperAdminStats } from "@/hooks/useSuperAdminStats";
import { Building2, Users, DollarSign, MessageSquare, TrendingUp } from "lucide-react";

const SuperAdminDashboard = () => {
  const { data: stats, isLoading } = useSuperAdminStats();

  if (isLoading) {
    return <AppLayout><p className="text-muted-foreground text-center py-12">Carregando métricas...</p></AppLayout>;
  }

  const growth = stats && stats.companiesLastMonth > 0
    ? Math.round(((stats.companiesThisMonth - stats.companiesLastMonth) / stats.companiesLastMonth) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Super Admin</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Companies Ativas" value={stats?.activeCompanies ?? 0} icon={Building2} />
          <MetricCard title="MRR" value={`R$ ${(stats?.mrr ?? 0).toFixed(2)}`} icon={DollarSign} />
          <MetricCard title="Usuários Totais" value={stats?.totalUsers ?? 0} icon={Users} />
          <MetricCard title="Tickets Abertos" value={stats?.openTickets ?? 0} icon={MessageSquare} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="Crescimento Mensal"
            value={`${growth >= 0 ? "+" : ""}${growth}%`}
            icon={TrendingUp}
            description={`${stats?.companiesThisMonth ?? 0} novas este mês vs ${stats?.companiesLastMonth ?? 0} mês anterior`}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default SuperAdminDashboard;
