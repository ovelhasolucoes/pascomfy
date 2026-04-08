import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePayments } from "@/hooks/usePayments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import { Zap, CreditCard } from "lucide-react";

const statusVariant: Record<string, any> = { ativo: "default", trial: "secondary", cancelado: "destructive", atrasado: "outline" };

const SuperAdminSubscriptions = () => {
  const { data: subs, isLoading, updateSubscription } = useSubscriptions();
  const { callBilling } = usePayments();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateSubscription.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateCustomer = async (sub: any) => {
    try {
      await callBilling.mutateAsync({
        action: "create_customer",
        company_id: sub.company_id,
        name: sub.companies?.name || "Company",
        email: `admin@${(sub.companies?.name || "company").toLowerCase().replace(/\s+/g, "")}.com`,
      });
      toast.success("Cliente criado no Asaas!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateCharge = async (sub: any) => {
    if (!sub.asaas_customer_id) {
      toast.error("Crie o cliente no Asaas primeiro");
      return;
    }
    try {
      const result = await callBilling.mutateAsync({
        action: "create_charge",
        subscription_id: sub.id,
        asaas_customer_id: sub.asaas_customer_id,
        amount: Number(sub.plans?.price_monthly || 0),
      });
      toast.success("Cobrança gerada!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Trial até</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subs || []).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.companies?.name}</TableCell>
                    <TableCell>{s.plans?.name}</TableCell>
                    <TableCell>R$ {Number(s.plans?.price_monthly || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Select defaultValue={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="atrasado">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{s.gateway || "—"}</TableCell>
                    <TableCell>
                      {s.trial_until ? format(new Date(s.trial_until), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="flex gap-1">
                      {!s.asaas_customer_id ? (
                        <Button size="sm" variant="outline" onClick={() => handleCreateCustomer(s)} disabled={callBilling.isPending}>
                          <Zap className="h-3 w-3 mr-1" />
                          Asaas
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleCreateCharge(s)} disabled={callBilling.isPending}>
                          <CreditCard className="h-3 w-3 mr-1" />
                          Cobrar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SuperAdminSubscriptions;
