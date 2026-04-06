import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSuperAdminCompanies } from "@/hooks/useSuperAdminStats";
import { CompanyDetailSheet } from "@/components/superadmin/CompanyDetailSheet";
import { CreateCompanyDialog } from "@/components/superadmin/CreateCompanyDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye } from "lucide-react";

const statusVariant: Record<string, any> = {
  ativa: "default",
  suspensa: "secondary",
  cancelada: "destructive",
};

const SuperAdminCompanies = () => {
  const { data: companies, isLoading } = useSuperAdminCompanies();
  const [selected, setSelected] = useState<any>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Companies</h1>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(companies || []).map((c: any) => {
                  const sub = c.subscriptions?.[0];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{sub?.plans?.name || "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell>{c.active_users_count}</TableCell>
                      <TableCell>{format(new Date(c.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setSelected(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <CompanyDetailSheet company={selected} open={!!selected} onClose={() => setSelected(null)} />
    </AppLayout>
  );
};

export default SuperAdminCompanies;
