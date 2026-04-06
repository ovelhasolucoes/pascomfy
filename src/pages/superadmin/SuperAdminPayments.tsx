import { AppLayout } from "@/components/layout/AppLayout";
import { usePayments } from "@/hooks/usePayments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const statusVariant: Record<string, any> = {
  pago: "default",
  pendente: "secondary",
  falhou: "destructive",
  estornado: "outline",
};

const SuperAdminPayments = () => {
  const { data: payments, isLoading } = usePayments();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.companies?.name}</TableCell>
                    <TableCell>{p.subscriptions?.plans?.name || "—"}</TableCell>
                    <TableCell>R$ {Number(p.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status] || "default"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>{p.gateway || "—"}</TableCell>
                    <TableCell>
                      {p.paid_at
                        ? format(new Date(p.paid_at), "dd/MM/yyyy")
                        : format(new Date(p.created_at), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {(payments || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum pagamento registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SuperAdminPayments;
