import { AppLayout } from "@/components/layout/AppLayout";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

const statusVariant: Record<string, any> = { ativo: "default", trial: "secondary", cancelado: "destructive", atrasado: "outline" };

const SuperAdminSubscriptions = () => {
  const { data: subs, isLoading, updateSubscription } = useSubscriptions();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateSubscription.mutateAsync({ id, status });
      toast.success("Status atualizado!");
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
                  <TableHead>Início</TableHead>
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
                    <TableCell>{format(new Date(s.started_at), "dd/MM/yyyy")}</TableCell>
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
