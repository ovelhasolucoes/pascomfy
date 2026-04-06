import { useState, useEffect, useMemo } from "react";
import type { Automation } from "@/hooks/useAutomations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bell, Smartphone, Eye } from "lucide-react";

const TRIGGERS = [
  { value: "usuario_escalado", label: "Usuário Escalado" },
  { value: "evento_proximo", label: "Evento Próximo" },
  { value: "substituicao_solicitada", label: "Substituição Solicitada" },
  { value: "substituicao_aprovada", label: "Substituição Aprovada" },
  { value: "presenca_pendente", label: "Presença Pendente" },
  { value: "evento_criado", label: "Evento Criado" },
];

const CHANNELS = [
  { value: "in_app", label: "In-App", icon: Bell },
  { value: "push", label: "Push", icon: Smartphone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

const VARIABLES = [
  { key: "{{evento_nome}}", label: "Nome do evento" },
  { key: "{{data}}", label: "Data" },
  { key: "{{hora}}", label: "Hora" },
  { key: "{{usuario_nome}}", label: "Nome do usuário" },
  { key: "{{funcao}}", label: "Função" },
  { key: "{{equipe}}", label: "Equipe" },
];

const SAMPLE_VALUES: Record<string, string> = {
  "{{evento_nome}}": "Missa Domingo",
  "{{data}}": "06/04/2026",
  "{{hora}}": "19:00",
  "{{usuario_nome}}": "João Silva",
  "{{funcao}}": "Fotógrafo",
  "{{equipe}}": "Comunicação",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Automation | null;
  onCreate: (data: Record<string, unknown>) => void;
  onUpdate: (data: Record<string, unknown>) => void;
  isCreating: boolean;
}

export function AutomationDialog({ open, onOpenChange, editing, onCreate, onUpdate, isCreating }: Props) {
  const [form, setForm] = useState({
    name: "",
    type: "automatica",
    channel: "in_app",
    trigger_event: "",
    title_template: "",
    message_template: "",
    config_json: {} as Record<string, unknown>,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        channel: editing.channel,
        trigger_event: editing.trigger_event || "",
        title_template: editing.title_template,
        message_template: editing.message_template,
        config_json: editing.config_json,
      });
    } else {
      setForm({ name: "", type: "automatica", channel: "in_app", trigger_event: "", title_template: "", message_template: "", config_json: {} });
    }
  }, [editing, open]);

  const resolvedTitle = useMemo(() => {
    let text = form.title_template;
    for (const [k, v] of Object.entries(SAMPLE_VALUES)) text = text.replaceAll(k, v);
    return text;
  }, [form.title_template]);

  const resolvedMessage = useMemo(() => {
    let text = form.message_template;
    for (const [k, v] of Object.entries(SAMPLE_VALUES)) text = text.replaceAll(k, v);
    return text;
  }, [form.message_template]);

  const insertVariable = (key: string) => {
    setForm((f) => ({ ...f, message_template: f.message_template + (f.message_template.endsWith(" ") || !f.message_template ? "" : " ") + key }));
  };

  const handleSave = () => {
    const payload = { ...form, trigger_event: form.trigger_event || null, active: true };
    if (editing) {
      onUpdate({ id: editing.id, ...payload });
    } else {
      onCreate(payload as never);
    }
    onOpenChange(false);
  };

  const sendTimingHours = (form.config_json?.horas_antes as number) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar" : "Nova"} Automação</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Left: Editor */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Notificar escalados" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatica">Automática</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => {
                      const Icon = c.icon;
                      return (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{c.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === "automatica" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Gatilho</Label>
                  <Select value={form.trigger_event} onValueChange={(v) => setForm((f) => ({ ...f, trigger_event: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tempo de envio</Label>
                  <Select
                    value={String(sendTimingHours)}
                    onValueChange={(v) => setForm((f) => ({ ...f, config_json: { ...f.config_json, horas_antes: Number(v) } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Imediato</SelectItem>
                      <SelectItem value="1">1h antes</SelectItem>
                      <SelectItem value="2">2h antes</SelectItem>
                      <SelectItem value="6">6h antes</SelectItem>
                      <SelectItem value="12">12h antes</SelectItem>
                      <SelectItem value="24">24h antes</SelectItem>
                      <SelectItem value="48">48h antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título</Label>
              <Input value={form.title_template} onChange={(e) => setForm((f) => ({ ...f, title_template: e.target.value }))} placeholder="Você foi escalado para {{evento_nome}}" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mensagem</Label>
              <Textarea value={form.message_template} onChange={(e) => setForm((f) => ({ ...f, message_template: e.target.value }))} placeholder="Olá {{usuario_nome}}, você foi escalado..." rows={5} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Variáveis disponíveis</Label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => insertVariable(v.key)}
                  >
                    {v.key}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />Preview em tempo real
            </div>

            {form.channel === "whatsapp" ? (
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4">
                  <div className="bg-background rounded-lg p-3 shadow-sm border max-w-[280px]">
                    <p className="text-sm font-semibold text-foreground">{resolvedTitle || "Título"}</p>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-line">{resolvedMessage || "Mensagem..."}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 text-right">19:00 ✓✓</p>
                  </div>
                </CardContent>
              </Card>
            ) : form.channel === "push" ? (
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4">
                  <div className="bg-background rounded-xl p-3 shadow-sm border flex items-start gap-3 max-w-[300px]">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Pascomfy</p>
                      <p className="text-sm font-semibold text-foreground truncate">{resolvedTitle || "Título"}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{resolvedMessage || "Mensagem..."}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4">
                  <div className="bg-background rounded-lg p-4 shadow-sm border max-w-[300px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Notificação</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{resolvedTitle || "Título"}</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{resolvedMessage || "Mensagem..."}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-dashed">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Variáveis de exemplo</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {VARIABLES.map((v) => (
                    <div key={v.key} className="flex justify-between">
                      <span className="text-muted-foreground">{v.label}:</span>
                      <span className="text-foreground font-medium">{SAMPLE_VALUES[v.key]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!form.name || !form.title_template || !form.message_template || isCreating}
          className="w-full mt-4"
        >
          {editing ? "Salvar Alterações" : "Criar Automação"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
