import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CreditCard, ArrowUpDown } from "lucide-react";

const statusBadge: Record<string, { variant: any; label: string }> = {
  ativo: { variant: "default", label: "Ativo" },
  trial: { variant: "secondary", label: "Trial" },
  atrasado: { variant: "destructive", label: "Atrasado" },
  cancelado: { variant: "outline", label: "Cancelado" },
};

const paymentStatusBadge: Record<string, any> = {
  pago: "default",
  pendente: "secondary",
  falhou: "destructive",
  estornado: "outline",
};

const MySubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-sub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["my-subscription-detail", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plans(name, price_monthly, max_users, max_storage_mb)")
        .eq("company_id", profile!.company_id!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: payments } = useQuery({
    queryKey: ["my-payments", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("company_id", profile!.company_id!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const plan = subscription?.plans as any;
  const status = statusBadge[subscription?.status || ""] || { variant: "outline", label: subscription?.status || "—" };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Minha Assinatura</h1>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : !subscription ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">Nenhuma assinatura ativa.</p>
              <Button onClick={() => navigate("/pricing")}>Ver planos</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan?.name || "Plano"}</CardTitle>
                    <CardDescription>
                      R$ {Number(plan?.price_monthly || 0).toFixed(2).replace(".", ",")}/mês
                    </CardDescription>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Usuários</p>
                    <p className="font-medium">Até {plan?.max_users || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Armazenamento</p>
                    <p className="font-medium">{plan?.max_storage_mb || "—"} MB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gateway</p>
                    <p className="font-medium capitalize">{subscription.gateway || "Nenhum"}</p>
                  </div>
                  {subscription.trial_until && (
                    <div>
                      <p className="text-muted-foreground">Trial até</p>
                      <p className="font-medium">{format(new Date(subscription.trial_until), "dd/MM/yyyy")}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
                    <ArrowUpDown className="h-4 w-4 mr-1" /> Alterar plano
                  </Button>
                  <Button size="sm" onClick={() => navigate(`/checkout/${subscription.plan_id}`)}>
                    <CreditCard className="h-4 w-4 mr-1" /> Pagar agora
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {(payments || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum pagamento registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Gateway</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payments || []).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{format(new Date(p.created_at), "dd/MM/yyyy")}</TableCell>
                          <TableCell>R$ {Number(p.amount).toFixed(2).replace(".", ",")}</TableCell>
                          <TableCell>
                            <Badge variant={paymentStatusBadge[p.status] || "outline"}>{p.status}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">{p.gateway || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MySubscriptionPage;
