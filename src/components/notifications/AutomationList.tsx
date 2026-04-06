import { useState } from "react";
import { useAutomations, type Automation } from "@/hooks/useAutomations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Zap, Send } from "lucide-react";

const TRIGGERS = [
  { value: "usuario_escalado", label: "Usuário Escalado" },
  { value: "evento_proximo", label: "Evento Próximo" },
  { value: "substituicao_solicitada", label: "Substituição Solicitada" },
  { value: "substituicao_aprovada", label: "Substituição Aprovada" },
  { value: "presenca_pendente", label: "Presença Pendente" },
  { value: "evento_criado", label: "Evento Criado" },
];

const CHANNELS = [
  { value: "in_app", label: "In-App" },
  { value: "push", label: "Push" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

const VARIABLES = ["{{evento_nome}}", "{{data}}", "{{hora}}", "{{usuario_nome}}", "{{funcao}}", "{{equipe}}"];

export function AutomationList() {
  const { automations, loading, create, update, remove, toggleActive, isCreating } = useAutomations();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "automatica",
    channel: "in_app" as string,
    trigger_event: "" as string,
    title_template: "",
    message_template: "",
    config_json: {} as Record<string, unknown>,
  });

  const resetForm = () => {
    setForm({ name: "", type: "automatica", channel: "in_app", trigger_event: "", title_template: "", message_template: "", config_json: {} });
    setEditing(null);
  };

  const openEdit = (a: Automation) => {
    setEditing(a);
    setForm({
      name: a.name,
      type: a.type,
      channel: a.channel,
      trigger_event: a.trigger_event || "",
      title_template: a.title_template,
      message_template: a.message_template,
      config_json: a.config_json,
    });
    setOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      trigger_event: form.trigger_event || null,
      active: true,
    };
    if (editing) {
      update({ id: editing.id, ...payload });
    } else {
      create(payload as never);
    }
    setOpen(false);
    resetForm();
  };

  const channelLabel = (ch: string) => CHANNELS.find((c) => c.value === ch)?.label || ch;
  const triggerLabel = (tr: string | null) => TRIGGERS.find((t) => t.value === tr)?.label || "Manual";

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Automações</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Automação</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nova"} Automação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Notificar escalados" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Canal</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Gatilho</Label>
                  <Select value={form.trigger_event} onValueChange={(v) => setForm((f) => ({ ...f, trigger_event: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Título (template)</Label>
                <Input value={form.title_template} onChange={(e) => setForm((f) => ({ ...f, title_template: e.target.value }))} placeholder="Você foi escalado para {{evento_nome}}" />
              </div>
              <div className="space-y-1">
                <Label>Mensagem (template)</Label>
                <Textarea value={form.message_template} onChange={(e) => setForm((f) => ({ ...f, message_template: e.target.value }))} placeholder="Olá {{usuario_nome}}, você foi escalado..." rows={4} />
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Variáveis:</span>
                {VARIABLES.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs cursor-pointer" onClick={() => setForm((f) => ({ ...f, message_template: f.message_template + " " + v }))}>
                    {v}
                  </Badge>
                ))}
              </div>
              <Button onClick={handleSave} disabled={!form.name || !form.title_template || !form.message_template || isCreating} className="w-full">
                {editing ? "Salvar Alterações" : "Criar Automação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {automations.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma automação criada ainda.</CardContent></Card>
      )}

      {automations.map((a) => (
        <Card key={a.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {a.type === "automatica" ? <Zap className="h-4 w-4 text-yellow-500" /> : <Send className="h-4 w-4 text-blue-500" />}
                <CardTitle className="text-base">{a.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={a.active} onCheckedChange={(active) => toggleActive({ id: a.id, active })} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 text-xs">
              <Badge variant="outline">{channelLabel(a.channel)}</Badge>
              <Badge variant="secondary">{triggerLabel(a.trigger_event)}</Badge>
              {!a.active && <Badge variant="destructive">Inativa</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{a.message_template}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
