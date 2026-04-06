import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useTeamTemplates } from "@/hooks/useTeamTemplates";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EventSettings = () => {
  const { eventTypes } = useEventTypes();
  const { templates } = useTeamTemplates();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [typeDialog, setTypeDialog] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeColor, setTypeColor] = useState("#6366f1");

  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateColor, setTemplateColor] = useState("#6366f1");

  const createType = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_types").insert({
        name: typeName,
        color: typeColor,
        company_id: profile!.company_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_types"] });
      toast.success("Tipo criado!");
      setTypeName("");
      setTypeDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_types"] });
      toast.success("Tipo removido");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_templates").insert({
        name: templateName,
        description: templateDesc || null,
        color: templateColor,
        company_id: profile!.company_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_templates"] });
      toast.success("Template criado!");
      setTemplateName("");
      setTemplateDesc("");
      setTemplateDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_templates"] });
      toast.success("Template removido");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações de Eventos</h1>
          <p className="text-muted-foreground">Gerencie tipos de evento e templates de equipe</p>
        </div>

        <Tabs defaultValue="types">
          <TabsList>
            <TabsTrigger value="types">Tipos de Evento</TabsTrigger>
            <TabsTrigger value="templates">Templates de Equipe</TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4 mt-4">
            <Button onClick={() => setTypeDialog(true)}><Plus className="h-4 w-4 mr-1" /> Novo Tipo</Button>
            <div className="grid gap-2">
              {eventTypes.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {t.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />}
                      <span className="text-foreground font-medium">{t.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteType.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <Button onClick={() => setTemplateDialog(true)}><Plus className="h-4 w-4 mr-1" /> Novo Template</Button>
            <div className="grid gap-2">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {t.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />}
                      <div>
                        <span className="text-foreground font-medium">{t.name}</span>
                        {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Type Dialog */}
        <Dialog open={typeDialog} onOpenChange={setTypeDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Tipo de Evento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="Ex: Missa" />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" value={typeColor} onChange={(e) => setTypeColor(e.target.value)} className="h-10 w-20" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTypeDialog(false)}>Cancelar</Button>
              <Button onClick={() => createType.mutate()} disabled={!typeName}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Template de Equipe</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ex: Fotografia" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} placeholder="Descrição" />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input type="color" value={templateColor} onChange={(e) => setTemplateColor(e.target.value)} className="h-10 w-20" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTemplateDialog(false)}>Cancelar</Button>
              <Button onClick={() => createTemplate.mutate()} disabled={!templateName}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EventSettings;
