import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, Save, Loader2, ShieldAlert, ExternalLink,
  Building2, Users, CreditCard, Globe, Plug, BarChart3, Settings,
} from "lucide-react";

const SuperAdminCompanyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["superadmin-company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*, subscriptions!companies_subscription_id_fkey(id, status, plan_id, trial_until, gateway, asaas_customer_id, plans(id, name, price_monthly, max_users, max_storage_mb, max_uploads))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <p className="text-muted-foreground text-center py-12">Carregando empresa...</p>
      </SuperAdminLayout>
    );
  }

  if (!company) {
    return (
      <SuperAdminLayout>
        <p className="text-muted-foreground text-center py-12">Empresa não encontrada.</p>
      </SuperAdminLayout>
    );
  }

  const sub = Array.isArray(company.subscriptions) ? company.subscriptions?.[0] : company.subscriptions;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/companies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={company.status === "ativa" ? "default" : "destructive"}>{company.status}</Badge>
              {sub && <Badge variant="outline">{(sub as any).plans?.name || "Sem plano"}</Badge>}
            </div>
          </div>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="geral" className="flex-1 gap-1 text-xs sm:text-sm">
              <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex-1 gap-1 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex-1 gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="dominio" className="flex-1 gap-1 text-xs sm:text-sm">
              <Globe className="h-4 w-4" /> <span className="hidden sm:inline">Domínio</span>
            </TabsTrigger>
            <TabsTrigger value="uso" className="flex-1 gap-1 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Uso</span>
            </TabsTrigger>
            <TabsTrigger value="acoes" className="flex-1 gap-1 text-xs sm:text-sm">
              <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Ações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <GeneralTab company={company} sub={sub} />
          </TabsContent>
          <TabsContent value="plano" className="mt-6">
            <PlanTab company={company} sub={sub} />
          </TabsContent>
          <TabsContent value="usuarios" className="mt-6">
            <UsersTab companyId={company.id} />
          </TabsContent>
          <TabsContent value="dominio" className="mt-6">
            <DomainTab company={company} />
          </TabsContent>
          <TabsContent value="uso" className="mt-6">
            <UsageTab company={company} sub={sub} />
          </TabsContent>
          <TabsContent value="acoes" className="mt-6">
            <ActionsTab company={company} />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

/* ── General Tab ── */
function GeneralTab({ company, sub }: { company: any; sub: any }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(company.status || "ativa");
  const [blockMode, setBlockMode] = useState(company.block_mode || "soft");
  const [trialUntil, setTrialUntil] = useState(company.trial_until ? company.trial_until.substring(0, 10) : "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ status: status as any, block_mode: blockMode, trial_until: trialUntil ? new Date(trialUntil).toISOString() : null } as any)
        .eq("id", company.id);
      if (error) throw error;
      toast.success("Empresa atualizada!");
      queryClient.invalidateQueries({ queryKey: ["superadmin-company", company.id] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-companies"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Dados Gerais</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Nome</p><p className="font-medium">{company.name}</p></div>
          <div><p className="text-muted-foreground text-xs">Criado em</p><p className="font-medium">{format(new Date(company.created_at), "dd/MM/yyyy")}</p></div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="suspensa">Suspensa</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Modo de Bloqueio</Label>
            <Select value={blockMode} onValueChange={setBlockMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="soft">Soft (banner + limita ações)</SelectItem>
                <SelectItem value="hard">Hard (bloqueia acesso)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Trial até</Label>
            <Input type="date" value={trialUntil} onChange={(e) => setTrialUntil(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Plan Tab ── */
function PlanTab({ company, sub }: { company: any; sub: any }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState(sub?.plan_id || "");
  const [subStatus, setSubStatus] = useState(sub?.status || "");
  const [subTrialUntil, setSubTrialUntil] = useState(sub?.trial_until ? sub.trial_until.substring(0, 10) : "");

  const { data: plans = [] } = useQuery({
    queryKey: ["plans-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, name, price_monthly").order("price_monthly", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleSave = async () => {
    if (!sub) return;
    setSaving(true);
    try {
      const updates: any = { status: subStatus, trial_until: subTrialUntil ? new Date(subTrialUntil).toISOString() : null };
      if (planId && planId !== sub.plan_id) updates.plan_id = planId;
      const { error } = await supabase.from("subscriptions").update(updates).eq("id", sub.id);
      if (error) throw error;
      toast.success("Assinatura atualizada!");
      queryClient.invalidateQueries({ queryKey: ["superadmin-company", company.id] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!sub) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Sem assinatura vinculada.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Plano & Assinatura</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs">Gateway</p><p className="font-medium">{sub.gateway || "—"}</p></div>
          <div><p className="text-muted-foreground text-xs">Asaas ID</p><p className="font-medium text-xs">{sub.asaas_customer_id || "—"}</p></div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Plano</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {Number(p.price_monthly).toFixed(2)}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status da Assinatura</Label>
            <Select value={subStatus} onValueChange={setSubStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Trial até</Label>
            <Input type="date" value={subTrialUntil} onChange={(e) => setSubTrialUntil(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Plano
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Users Tab ── */
function UsersTab({ companyId }: { companyId: string }) {
  const { data: users, isLoading } = useQuery({
    queryKey: ["superadmin-company-users", companyId],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, email, status, created_at")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      return profiles.map((p) => ({
        ...p,
        role: (roles || []).find((r) => r.user_id === p.id)?.role || "colaborador",
      }));
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Usuários da Empresa ({users?.length || 0})</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users || []).map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.permission_level}</Badge></TableCell>
                    <TableCell>{u.status}</TableCell>
                    <TableCell>{format(new Date(u.created_at), "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                ))}
                {(users || []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Nenhum usuário</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Domain Tab ── */
function DomainTab({ company }: { company: any }) {
  return (
    <Card>
      <CardHeader><CardTitle>Domínio Customizado</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Domínio</p>
            <p className="font-medium">{company.custom_domain || "Não configurado"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Verificado</p>
            <p>
              {company.domain_verified ? (
                <Badge variant="default">Sim</Badge>
              ) : (
                <Badge variant="secondary">Não</Badge>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Usage Tab ── */
function UsageTab({ company, sub }: { company: any; sub: any }) {
  const plan = sub?.plans;
  const storagePercent = plan?.max_storage_mb ? Math.min(100, (company.storage_used_mb / plan.max_storage_mb) * 100) : 0;
  const usersPercent = plan?.max_users ? Math.min(100, (company.active_users_count / plan.max_users) * 100) : 0;

  return (
    <Card>
      <CardHeader><CardTitle>Consumo</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-medium">{company.storage_used_mb} / {plan?.max_storage_mb || "∞"} MB</span>
          </div>
          <Progress value={storagePercent} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usuários ativos</span>
            <span className="font-medium">{company.active_users_count} / {plan?.max_users || "∞"}</span>
          </div>
          <Progress value={usersPercent} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Actions Tab ── */
function ActionsTab({ company }: { company: any }) {
  const queryClient = useQueryClient();
  const [blocking, setBlocking] = useState(false);

  const handleBlock = async (newStatus: string) => {
    setBlocking(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ status: newStatus as any } as any)
        .eq("id", company.id);
      if (error) throw error;
      toast.success(`Empresa ${newStatus === "suspensa" ? "bloqueada" : "ativada"}!`);
      queryClient.invalidateQueries({ queryKey: ["superadmin-company", company.id] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBlocking(false);
    }
  };

  const handleImpersonate = () => {
    // For now, open in new tab with company context
    // Full impersonation via Edge Function will be added later
    toast.info("Funcionalidade de impersonação será implementada com Edge Function dedicada.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Ações da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {company.status === "ativa" ? (
              <Button variant="destructive" onClick={() => handleBlock("suspensa")} disabled={blocking}>
                Bloquear Empresa
              </Button>
            ) : (
              <Button variant="default" onClick={() => handleBlock("ativa")} disabled={blocking}>
                Ativar Empresa
              </Button>
            )}
            <Button variant="outline" onClick={handleImpersonate}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Entrar como Empresa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SuperAdminCompanyDetail;
