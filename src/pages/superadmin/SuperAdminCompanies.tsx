import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdminCompanies } from "@/hooks/useSuperAdminStats";
import { CreateCompanyDialog } from "@/components/superadmin/CreateCompanyDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusVariant: Record<string, any> = {
  ativa: "default",
  suspensa: "secondary",
  cancelada: "destructive",
};

const SuperAdminCompanies = () => {
  const { data: companies, isLoading } = useSuperAdminCompanies();
  const navigate = useNavigate();

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <CreateCompanyDialog />
        </div>
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
                  <TableHead>Domínio</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(companies || []).map((c: any) => {
                  const sub = Array.isArray(c.subscriptions) ? c.subscriptions?.[0] : c.subscriptions;
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/superadmin/companies/${c.id}`)}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{sub?.plans?.name || "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant[c.status]}>{c.status}</Badge></TableCell>
                      <TableCell>{c.active_users_count}</TableCell>
                      <TableCell className="text-xs">{c.custom_domain || "—"}</TableCell>
                      <TableCell>{format(new Date(c.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/superadmin/companies/${c.id}`); }}>
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
    </SuperAdminLayout>
  );
};

export default SuperAdminCompanies;
