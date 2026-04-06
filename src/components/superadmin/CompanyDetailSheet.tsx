import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface CompanyDetailSheetProps {
  company: any | null;
  open: boolean;
  onClose: () => void;
}

export function CompanyDetailSheet({ company, open, onClose }: CompanyDetailSheetProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Editable company fields
  const [status, setStatus] = useState("");
  const [blockMode, setBlockMode] = useState("");
  const [trialUntil, setTrialUntil] = useState("");

  // Editable subscription fields
  const [subStatus, setSubStatus] = useState("");
  const [planId, setPlanId] = useState("");
  const [subTrialUntil, setSubTrialUntil] = useState("");

  const { data: plans = [] } = useQuery({
    queryKey: ["plans-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price_monthly")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Reset form when company changes
  useEffect(() => {
    if (company) {
      setStatus(company.status || "ativa");
      setBlockMode(company.block_mode || "soft");
      setTrialUntil(company.trial_until ? company.trial_until.substring(0, 10) : "");

      const sub = company.subscriptions?.[0];
      if (sub) {
        setSubStatus(sub.status || "");
        setPlanId(sub.plan_id || "");
        setSubTrialUntil(sub.trial_until ? sub.trial_until.substring(0, 10) : "");
      }
    }
  }, [company]);

  if (!company) return null;

  const sub = company.subscriptions?.[0];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update company
      const { error: compErr } = await supabase
        .from("companies")
        .update({
          status: status as any,
          block_mode: blockMode,
          trial_until: trialUntil ? new Date(trialUntil).toISOString() : null,
        } as any)
        .eq("id", company.id);
      if (compErr) throw compErr;

      // Update subscription if exists
      if (sub) {
        const subUpdates: any = {
          status: subStatus,
          trial_until: subTrialUntil ? new Date(subTrialUntil).toISOString() : null,
        };

        // If plan changed, update plan_id
        if (planId && planId !== sub.plan_id) {
          subUpdates.plan_id = planId;
        }

        const { error: subErr } = await supabase
          .from("subscriptions")
          .update(subUpdates)
          .eq("id", sub.id);
        if (subErr) throw subErr;
      }

      toast.success("Empresa atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["superadmin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{company.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Company Info */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Dados da Empresa</p>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Status</Label>
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
              <Label className="text-muted-foreground text-xs">Modo de bloqueio</Label>
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
              <Label className="text-muted-foreground text-xs">Trial até</Label>
              <Input
                type="date"
                value={trialUntil}
                onChange={(e) => setTrialUntil(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Usuários ativos</p>
                <p className="font-medium text-foreground">{company.active_users_count}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Storage</p>
                <p className="font-medium text-foreground">{company.storage_used_mb} MB</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Domínio custom</p>
                <p className="font-medium text-foreground">{company.custom_domain || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Criado em</p>
                <p className="font-medium text-foreground">{format(new Date(company.created_at), "dd/MM/yyyy")}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subscription */}
          {sub ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Assinatura</p>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Plano</Label>
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
                <Label className="text-muted-foreground text-xs">Status da assinatura</Label>
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
                <Label className="text-muted-foreground text-xs">Trial da assinatura até</Label>
                <Input
                  type="date"
                  value={subTrialUntil}
                  onChange={(e) => setSubTrialUntil(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Gateway</p>
                  <p className="text-foreground">{sub.gateway || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Asaas ID</p>
                  <p className="text-foreground text-xs">{sub.asaas_customer_id || "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem assinatura vinculada.</p>
          )}

          <Separator />

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
