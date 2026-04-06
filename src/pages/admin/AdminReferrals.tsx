import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAffiliateProgram } from "@/hooks/useAffiliateProgram";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Gift, Loader2, Users } from "lucide-react";
import { format } from "date-fns";

const AdminReferrals = () => {
  const { program, loadingProgram, createProgram, referrals, loadingReferrals, rewards } = useAffiliateProgram();

  useEffect(() => {
    if (!loadingProgram && !program) {
      createProgram.mutate();
    }
  }, [loadingProgram, program]);

  const shareLink = program ? `${window.location.origin}/signup?ref=${program.code}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado!");
  };

  const rewardTypeLabel: Record<string, string> = {
    dias_gratis: "Dias grátis",
    desconto: "Desconto",
    upgrade: "Upgrade",
  };

  const statusColor: Record<string, "default" | "secondary" | "destructive"> = {
    pendente: "secondary",
    convertido: "default",
    cancelado: "destructive",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Indicações</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Seu Programa de Indicação</CardTitle>
            <CardDescription>Compartilhe seu link e ganhe recompensas quando empresas indicadas assinarem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProgram || createProgram.isPending ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
            ) : program ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Seu código</label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">{program.code}</code>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Link de indicação</label>
                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Recompensa: <strong className="text-foreground">{rewardTypeLabel[(program as any).reward_type] || (program as any).reward_type}</strong></span>
                  <span>Valor: <strong className="text-foreground">{Number((program as any).reward_value)}{(program as any).reward_type === "desconto" ? "%" : " dias"}</strong></span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReferrals ? (
              <p className="text-muted-foreground text-center py-4">Carregando...</p>
            ) : referrals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma indicação ainda. Compartilhe seu link!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{(r.companies as any)?.name || "—"}</TableCell>
                      <TableCell><Badge variant={statusColor[r.status] || "secondary"}>{r.status}</Badge></TableCell>
                      <TableCell>{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {rewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Recompensas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Aplicada</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((rw: any) => (
                    <TableRow key={rw.id}>
                      <TableCell>{rewardTypeLabel[rw.reward_type] || rw.reward_type}</TableCell>
                      <TableCell>{Number(rw.reward_value)}{rw.reward_type === "desconto" ? "%" : " dias"}</TableCell>
                      <TableCell><Badge variant={rw.applied ? "default" : "secondary"}>{rw.applied ? "Sim" : "Pendente"}</Badge></TableCell>
                      <TableCell>{format(new Date(rw.created_at), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminReferrals;
