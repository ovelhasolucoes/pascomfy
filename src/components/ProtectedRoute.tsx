import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();

  const { data: company } = useQuery({
    queryKey: ["my-company", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data } = await supabase
        .from("companies")
        .select("status, block_mode")
        .eq("id", profile.company_id)
        .single();
      return data;
    },
    enabled: !!profile?.company_id,
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

  // Soft block: show banner but allow access
  const showBanner =
    company &&
    (company as any).block_mode === "soft" &&
    (company as any).status === "suspensa";

  return (
    <>
      {showBanner && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-sm text-destructive flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Sua empresa está com pagamento pendente. Algumas funcionalidades estão limitadas.
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
