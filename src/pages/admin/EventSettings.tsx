import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useTeamTemplates } from "@/hooks/useTeamTemplates";
import { useChecklistTemplates } from "@/hooks/useChecklistTemplates";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewChecklistItem {
  title: string;
  description: string;
  is_required: boolean;
  scope: string;
}

const EventSettings = () => {
  const { eventTypes } = useEventTypes();
  const { templates } = useTeamTemplates();
  const { templates: clTemplates, createTemplate: createClTemplate, deleteTemplate: deleteClTemplate } = useChecklistTemplates();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [typeDialog, setTypeDialog] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeColor, setTypeColor] = useState("#6366f1");

  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateColor, setTemplateColor] = useState("#6366f1");

  // Checklist template state
  const [clDialog, setClDialog] = useState(false);
  const [clName, setClName] = useState("");
  const [clDesc, setClDesc] = useState("");
  const [clItems, setClItems] = useState<NewChecklistItem[]>([
    { title: "", description: "", is_required: false, scope: "shared" },
  ]);

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

  const handleCreateClTemplate = async () => {
    const validItems = clItems.filter((i) => i.title.trim());
    try {
      await createClTemplate.mutateAsync({
        name: clName,
        description: clDesc || undefined,
        items: validItems,
      });
      toast.success("Template de checklist criado!");
      setClName("");
      setClDesc("");
      setClItems([{ title: "", description: "", is_required: false, scope: "shared" }]);
      setClDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteClTemplate = async (id: string) => {
    try {
      await deleteClTemplate.mutateAsync(id);
      toast.success("Template removido");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addClItem = () => setClItems([...clItems, { title: "", description: "", is_required: false, scope: "shared" }]);
  const removeClItem = (idx: number) => setClItems(clItems.filter((_, i) => i !== idx));
  const updateClItem = (idx: number, field: keyof NewChecklistItem, value: any) => {
    const updated = [...clItems];
    (updated[idx] as any)[field] = value;
    setClItems(updated);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações de Eventos</h1>
          <p className="text-muted-foreground">Gerencie tipos, templates de equipe e checklists</p>
        </div>

        <Tabs defaultValue="types">
          <TabsList className="flex-wrap">
            <TabsTrigger value="types">Tipos</TabsTrigger>
            <TabsTrigger value="templates">Equipes</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
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

          <TabsContent value="checklists" className="space-y-4 mt-4">
            <Button onClick={() => setClDialog(true)}><Plus className="h-4 w-4 mr-1" /> Novo Template de Checklist</Button>
            <div className="grid gap-2">
              {clTemplates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-foreground font-medium">{t.name}</span>
                      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{t.items.length} itens</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => handleDeleteClTemplate(t.id)}>
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

        {/* Checklist Template Dialog */}
        <Dialog open={clDialog} onOpenChange={setClDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Template de Checklist</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={clName} onChange={(e) => setClName(e.target.value)} placeholder="Ex: Preparação do Som" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={clDesc} onChange={(e) => setClDesc(e.target.value)} placeholder="Descrição (opcional)" />
              </div>
              <div className="space-y-3">
                <Label>Itens do Template</Label>
                {clItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.title}
                        onChange={(e) => updateClItem(idx, "title", e.target.value)}
                        placeholder="Título do item"
                        className="flex-1"
                      />
                      {clItems.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeClItem(idx)} className="shrink-0 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={item.description}
                      onChange={(e) => updateClItem(idx, "description", e.target.value)}
                      placeholder="Descrição (opcional)"
                    />
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={item.is_required}
                          onCheckedChange={(v) => updateClItem(idx, "is_required", !!v)}
                        />
                        <span className="text-xs text-muted-foreground">Obrigatório</span>
                      </div>
                      <Select value={item.scope} onValueChange={(v) => updateClItem(idx, "scope", v)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shared">Equipe</SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addClItem} className="w-full">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar item
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateClTemplate} disabled={!clName.trim() || !clItems.some(i => i.title.trim())}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EventSettings;
