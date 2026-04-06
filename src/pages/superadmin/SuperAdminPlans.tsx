import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSuperAdminPlans } from "@/hooks/useSuperAdminStats";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

const emptyPlan = { name: "", price_monthly: 0, max_users: 10, max_storage_mb: 500, max_uploads: 100, allows_whitelabel: false, allows_custom_domain: false, description: "", trial_days: 14 };

const SuperAdminPlans = () => {
  const { data: plans, isLoading } = useSuperAdminPlans();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyPlan);

  const openNew = () => { setForm(emptyPlan); setEditing("new"); };
  const openEdit = (p: any) => { setForm({ name: p.name, price_monthly: p.price_monthly, max_users: p.max_users, max_storage_mb: p.max_storage_mb, max_uploads: p.max_uploads, allows_whitelabel: p.allows_whitelabel, allows_custom_domain: p.allows_custom_domain, description: p.description || "", trial_days: p.trial_days ?? 14 }); setEditing(p.id); };

  const save = async () => {
    try {
      if (editing === "new") {
        const { error } = await supabase.from("plans").insert(form as any);
        if (error) throw error;
        toast.success("Plano criado!");
      } else {
        const { error } = await supabase.from("plans").update(form as any).eq("id", editing);
        if (error) throw error;
        toast.success("Plano atualizado!");
      }
      queryClient.invalidateQueries({ queryKey: ["superadmin-plans"] });
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Plano</Button>
        </div>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço/mês</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Whitelabel</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(plans || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>R$ {Number(p.price_monthly).toFixed(2)}</TableCell>
                    <TableCell>{p.max_users}</TableCell>
                    <TableCell>{p.max_storage_mb} MB</TableCell>
                    <TableCell>{p.allows_whitelabel ? <Badge>Sim</Badge> : "Não"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Novo Plano" : "Editar Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Preço mensal (R$)</Label><Input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value) })} /></div>
              <div><Label>Max usuários</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: Number(e.target.value) })} /></div>
              <div><Label>Storage (MB)</Label><Input type="number" value={form.max_storage_mb} onChange={(e) => setForm({ ...form, max_storage_mb: Number(e.target.value) })} /></div>
              <div><Label>Max uploads</Label><Input type="number" value={form.max_uploads} onChange={(e) => setForm({ ...form, max_uploads: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.allows_whitelabel} onCheckedChange={(v) => setForm({ ...form, allows_whitelabel: v })} /><Label>Whitelabel</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.allows_custom_domain} onCheckedChange={(v) => setForm({ ...form, allows_custom_domain: v })} /><Label>Domínio custom</Label></div>
            </div>
            <Button className="w-full" onClick={save}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SuperAdminPlans;
