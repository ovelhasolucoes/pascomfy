import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock } from "lucide-react";

const TRIAL_EXEMPT_ROUTES = ["/pricing", "/checkout", "/profile", "/account-blocked"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();

  const { data: company } = useQuery({
    queryKey: ["my-company", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data } = await supabase
        .from("companies")
        .select("status, block_mode, trial_until")
        .eq("id", profile.company_id)
        .single();
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription-status", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("status, trial_until, plan_id")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.company_id,
  });

  // Check if user is super_admin (exempt from trial checks)
  const { data: isSuperAdmin } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "super_admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Hard block: redirect to blocked page
  if (
    company &&
    (company as any).block_mode === "hard" &&
    ((company as any).status === "suspensa" || (company as any).status === "cancelada")
  ) {
    return <Navigate to="/account-blocked" replace />;
  }

  // Trial expired check — redirect to pricing (unless super_admin or on exempt route)
  const isExemptRoute = TRIAL_EXEMPT_ROUTES.some((r) => location.pathname.startsWith(r));
  const isTrialExpired =
    subscription &&
    (subscription as any).status === "trial" &&
    (subscription as any).trial_until &&
    new Date((subscription as any).trial_until) < new Date();
  const isSubscriptionOverdue = subscription && (subscription as any).status === "atrasado";

  if (!isSuperAdmin && !isExemptRoute && (isTrialExpired || isSubscriptionOverdue)) {
    return <Navigate to="/pricing" replace />;
  }

  // Soft block: show banner but allow access
  const showBanner =
    company &&
    (company as any).block_mode === "soft" &&
    (company as any).status === "suspensa";

  // Trial warning: show days remaining
  const trialDaysLeft =
    subscription &&
    (subscription as any).status === "trial" &&
    (subscription as any).trial_until
      ? Math.max(0, Math.ceil((new Date((subscription as any).trial_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  const showTrialBanner = trialDaysLeft !== null && trialDaysLeft <= 7 && !isSuperAdmin;

  return (
    <>
      {showBanner && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-sm text-destructive flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Sua empresa está com pagamento pendente. Algumas funcionalidades estão limitadas.
        </div>
      )}
      {showTrialBanner && (
        <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 text-center text-sm text-warning flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          {trialDaysLeft === 0
            ? "Seu trial expira hoje! "
            : `Seu trial expira em ${trialDaysLeft} dia${trialDaysLeft > 1 ? "s" : ""}. `}
          <a href="/pricing" className="underline font-medium">Assinar agora</a>
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
