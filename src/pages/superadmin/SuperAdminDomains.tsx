import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const SuperAdminDomains = () => {
  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ["superadmin-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, custom_domain, domain_verified, status")
        .not("custom_domain", "is", null)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleVerify = async (companyId: string, domain: string) => {
    try {
      const { error } = await supabase.functions.invoke("verify-domain", {
        body: { company_id: companyId, domain },
      });
      if (error) throw error;
      toast.success("Verificação iniciada!");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao verificar domínio");
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Domínios</h1>
        <p className="text-sm text-muted-foreground">
          Todos os domínios customizados cadastrados pelas empresas.
        </p>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(companies || []).map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><code className="bg-muted px-2 py-1 rounded text-sm">{c.custom_domain}</code></TableCell>
                    <TableCell>
                      {c.domain_verified ? (
                        <Badge variant="default">Verificado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={c.status === "ativa" ? "default" : "destructive"}>{c.status}</Badge></TableCell>
                    <TableCell>
                      {!c.domain_verified && (
                        <Button variant="ghost" size="sm" onClick={() => handleVerify(c.id, c.custom_domain)}>
                          <RefreshCw className="h-4 w-4 mr-1" /> Verificar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(companies || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum domínio customizado cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDomains;
