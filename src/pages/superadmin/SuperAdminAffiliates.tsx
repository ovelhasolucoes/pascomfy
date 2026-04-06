import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const rewardLabel: Record<string, string> = {
  dias_gratis: "Dias grátis",
  desconto: "Desconto",
  upgrade: "Upgrade",
};

const SuperAdminAffiliates = () => {
  const queryClient = useQueryClient();

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

  const { data: allRewards } = useQuery({
    queryKey: ["superadmin-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_rewards" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("affiliate_program")
        .update({ active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-affiliates"] });
      toast.success("Status atualizado");
    },
  });

  const rewardsByAffiliate = (companyId: string) =>
    (allRewards || []).filter((r: any) => r.affiliate_company_id === companyId);

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
                  <TableHead>Recompensa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Indicações</TableHead>
                  <TableHead>Convertidas</TableHead>
                  <TableHead>Recompensas</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(affiliates || []).map((a: any) => {
                  const total = a.affiliate_referrals?.length || 0;
                  const converted = a.affiliate_referrals?.filter((r: any) => r.status === "convertido").length || 0;
                  const rws = rewardsByAffiliate(a.company_id);
                  const appliedCount = rws.filter((r: any) => r.applied).length;

                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.companies?.name}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-sm">{a.code}</code></TableCell>
                      <TableCell>{rewardLabel[a.reward_type] || a.reward_type}</TableCell>
                      <TableCell>{Number(a.reward_value)}{a.reward_type === "desconto" ? "%" : " dias"}</TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>{converted}</TableCell>
                      <TableCell>{appliedCount}/{rws.length}</TableCell>
                      <TableCell>{a.active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive.mutate({ id: a.id, active: !a.active })}
                        >
                          {a.active ? "Desativar" : "Ativar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(affiliates || []).length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum afiliado cadastrado</TableCell></TableRow>
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
