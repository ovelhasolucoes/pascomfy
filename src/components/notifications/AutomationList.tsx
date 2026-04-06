import { useState } from "react";
import { useAutomations, type Automation } from "@/hooks/useAutomations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Zap, Send, Copy, MessageSquare, Bell, Mail, Smartphone } from "lucide-react";
import { AutomationDialog } from "./AutomationDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TRIGGERS: Record<string, string> = {
  usuario_escalado: "Usuário Escalado",
  evento_proximo: "Evento Próximo",
  substituicao_solicitada: "Substituição Solicitada",
  substituicao_aprovada: "Substituição Aprovada",
  presenca_pendente: "Presença Pendente",
  evento_criado: "Evento Criado",
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  in_app: { label: "In-App", icon: Bell, color: "text-primary" },
  push: { label: "Push", icon: Smartphone, color: "text-primary" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "text-primary" },
  email: { label: "Email", icon: Mail, color: "text-muted-foreground" },
};

export function AutomationList() {
  const { automations, loading, create, update, remove, toggleActive, isCreating } = useAutomations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filtered = automations.filter((a) => {
    if (filterChannel !== "all" && a.channel !== filterChannel) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    return true;
  });

  const handleDuplicate = (a: Automation) => {
    create({
      name: `${a.name} (cópia)`,
      type: a.type,
      channel: a.channel as "in_app" | "push" | "whatsapp" | "email",
      trigger_event: a.trigger_event,
      active: false,
      title_template: a.title_template,
      message_template: a.message_template,
      config_json: a.config_json,
    } as never);
  };

  const openEdit = (a: Automation) => {
    setEditing(a);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Carregando automações...</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              <SelectItem value="in_app">In-App</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="automatica">Automática</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Nova Automação</Button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma automação encontrada.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />Criar primeira automação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="grid gap-3">
        {filtered.map((a) => {
          const ch = CHANNEL_CONFIG[a.channel] || CHANNEL_CONFIG.in_app;
          const ChannelIcon = ch.icon;
          return (
            <Card key={a.id} className={`transition-opacity ${!a.active ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`mt-0.5 p-2 rounded-lg bg-muted`}>
                      {a.type === "automatica" ? <Zap className="h-4 w-4 text-primary" /> : <Send className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm text-foreground truncate">{a.name}</h4>
                        {!a.active && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1">
                          <ChannelIcon className={`h-3 w-3 ${ch.color}`} />{ch.label}
                        </Badge>
                        {a.trigger_event && (
                          <Badge variant="secondary" className="text-xs">
                            {TRIGGERS[a.trigger_event] || a.trigger_event}
                          </Badge>
                        )}
                        {a.type === "manual" && <Badge variant="secondary" className="text-xs">Manual</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{a.message_template}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={a.active} onCheckedChange={(active) => toggleActive({ id: a.id, active })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(a)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog */}
      <AutomationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onCreate={create}
        onUpdate={update}
        isCreating={isCreating}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) remove(deleteId); setDeleteId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
