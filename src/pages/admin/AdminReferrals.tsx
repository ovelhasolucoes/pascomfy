import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAffiliateProgram } from "@/hooks/useAffiliateProgram";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Gift, Loader2, Users, Share2, TrendingUp, CheckCircle2, Clock, Link2, MessageCircle } from "lucide-react";
import { format } from "date-fns";

const rewardTypeLabel: Record<string, string> = {
  dias_gratis: "Dias grátis",
  desconto: "Desconto",
  upgrade: "Upgrade",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  convertido: "Convertido",
  cancelado: "Cancelado",
};

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

  const copyCode = () => {
    if (program) {
      navigator.clipboard.writeText(program.code);
      toast.success("Código copiado!");
    }
  };

  const totalReferrals = referrals.length;
  const convertedReferrals = referrals.filter((r: any) => r.status === "convertido").length;
  const pendingReferrals = referrals.filter((r: any) => r.status === "pendente").length;
  const appliedRewards = rewards.filter((r: any) => r.applied).length;

  if (loadingProgram || createProgram.isPending) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programa de Indicação</h1>
          <p className="text-muted-foreground mt-1">Indique paróquias e ganhe recompensas quando elas assinarem</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
                  <p className="text-xs text-muted-foreground">Total de indicações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{convertedReferrals}</p>
                  <p className="text-xs text-muted-foreground">Convertidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/10 p-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingReferrals}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{appliedRewards}</p>
                  <p className="text-xs text-muted-foreground">Recompensas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Card */}
        {program && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Compartilhe e Ganhe
              </CardTitle>
              <CardDescription>
                Cada paróquia que assinar usando seu link, você ganha{" "}
                <strong className="text-foreground">
                  {Number((program as any).reward_value)}
                  {(program as any).reward_type === "desconto" ? "% de desconto" : " dias grátis"}
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Seu código exclusivo</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted px-4 py-2.5 rounded-md font-mono text-lg font-bold tracking-wider text-center text-foreground">
                      {program.code}
                    </div>
                    <Button variant="outline" size="icon" onClick={copyCode} title="Copiar código">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Link de indicação</label>
                  <div className="flex gap-2">
                    <Input value={shareLink} readOnly className="font-mono text-xs" />
                    <Button onClick={copyLink} className="shrink-0 gap-2">
                      <Link2 className="h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Referrals & Rewards */}
        <Tabs defaultValue="referrals">
          <TabsList>
            <TabsTrigger value="referrals" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Indicações ({totalReferrals})
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="h-4 w-4" />
              Recompensas ({rewards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {loadingReferrals ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="mx-auto rounded-full bg-muted p-4 w-fit">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">Nenhuma indicação ainda</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Compartilhe seu link com outras paróquias e comece a ganhar recompensas!
                    </p>
                    <Button variant="outline" onClick={copyLink} className="gap-2 mt-2">
                      <Link2 className="h-4 w-4" />
                      Copiar link de indicação
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paróquia indicada</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{(r.companies as any)?.name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "convertido" ? "default" : r.status === "cancelado" ? "destructive" : "secondary"}>
                              {statusLabel[r.status] || r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {rewards.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="mx-auto rounded-full bg-muted p-4 w-fit">
                      <Gift className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">Nenhuma recompensa ainda</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Quando suas indicações assinarem, suas recompensas aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewards.map((rw: any) => (
                        <TableRow key={rw.id}>
                          <TableCell className="font-medium">{rewardTypeLabel[rw.reward_type] || rw.reward_type}</TableCell>
                          <TableCell>
                            {Number(rw.reward_value)}{rw.reward_type === "desconto" ? "%" : " dias"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rw.applied ? "default" : "secondary"} className="gap-1">
                              {rw.applied ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {rw.applied ? "Aplicada" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(rw.created_at), "dd/MM/yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminReferrals;
