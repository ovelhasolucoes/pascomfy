import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type NotificationType = Database["public"]["Enums"]["notification_type"];

interface NotificationTemplate {
  id: string;
  title: string;
  message_template: string;
  type: NotificationType;
  company_id: string | null;
}

export function NotificationTemplates() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [type, setType] = useState<NotificationType>("aviso");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["notification-templates", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NotificationTemplate[];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notification_templates").insert({
        company_id: companyId!,
        title,
        message_template: messageTemplate,
        type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast.success("Template criado!");
      setTitle("");
      setMessageTemplate("");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast.success("Template removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const typeLabels: Record<NotificationType, string> = {
    escala: "Escala",
    evento: "Evento",
    aviso: "Aviso",
    sistema: "Sistema",
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Templates de Notificação</h3>
          <p className="text-sm text-muted-foreground">Crie templates reutilizáveis para envio rápido</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum template criado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{t.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {typeLabels[t.type]}
                    </span>
                    {!t.company_id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Global
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{t.message_template}</p>
                </div>
                {t.company_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(t.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Template de Notificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Lembrete de evento" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="escala">Escala</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Olá! Você foi escalado para o evento {{evento}}..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{variavel}}"} para inserir dados dinâmicos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!title || !messageTemplate}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
