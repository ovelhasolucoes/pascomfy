import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const SuperAdminAffiliates = () => {
  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["superadmin-affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_program")
        .select("*, companies(name), affiliate_referrals(id, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Afiliados</h1>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Indicações</TableHead>
                  <TableHead>Convertidas</TableHead>
                  <TableHead>Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(affiliates || []).map((a: any) => {
                  const total = a.affiliate_referrals?.length || 0;
                  const converted = a.affiliate_referrals?.filter((r: any) => r.status === "convertido").length || 0;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.companies?.name}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-sm">{a.code}</code></TableCell>
                      <TableCell>{Number(a.commission_pct)}%</TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>{converted}</TableCell>
                      <TableCell>{a.active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
                {(affiliates || []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum afiliado cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SuperAdminAffiliates;
