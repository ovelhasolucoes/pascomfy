import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [planId, setPlanId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const queryClient = useQueryClient();

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

  const createCompany = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nome da empresa é obrigatório");
      if (!planId) throw new Error("Selecione um plano");

      const companyId = crypto.randomUUID();

      // 1. Create company first (no subscription yet)
      const { error: compErr } = await supabase
        .from("companies")
        .insert({
          id: companyId,
          name: name.trim(),
          status: "ativa" as const,
          plan_id: planId,
        });
      if (compErr) throw compErr;

      // 2. Create subscription referencing existing company
      const { data: sub, error: subErr } = await supabase
        .from("subscriptions")
        .insert({
          plan_id: planId,
          company_id: companyId,
          status: "ativo" as const,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (subErr) throw subErr;

      // 3. Link subscription to company
      const { error: updErr } = await supabase
        .from("companies")
        .update({ subscription_id: sub.id })
        .eq("id", companyId);
      if (updErr) throw updErr;

      // 3. If admin email provided, create invite
      if (adminEmail.trim()) {
        await supabase.from("invites").insert({
          company_id: companyId,
          email: adminEmail.trim().toLowerCase(),
          role: "admin" as const,
          created_by: (await supabase.auth.getUser()).data.user!.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      return companyId;
    },
    onSuccess: () => {
      toast.success("Empresa criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["superadmin-companies"] });
      setOpen(false);
      setName("");
      setPlanId("");
      setAdminEmail("");
      setAdminName("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar empresa");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar nova empresa</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCompany.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da empresa *</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Igreja Central"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Plano *</Label>
            <Select value={planId} onValueChange={setPlanId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {Number(p.price_monthly).toFixed(2)}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">E-mail do admin (opcional)</Label>
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@empresa.com"
            />
            <p className="text-xs text-muted-foreground">
              Um convite será enviado para este e-mail como admin.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCompany.isPending}>
              {createCompany.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar empresa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
