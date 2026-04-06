import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useChecklistTemplates } from "@/hooks/useChecklistTemplates";

interface AdHocItem {
  title: string;
  description: string;
  is_required: boolean;
  scope: string;
}

interface AddChecklistDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFromTemplate: (templateId: string, eventTeamId?: string) => Promise<void>;
  onAddAdHoc: (name: string, items: AdHocItem[], eventTeamId?: string) => Promise<void>;
  teams: { id: string; name: string }[];
}

export const AddChecklistDialog = ({ open, onClose, onAddFromTemplate, onAddAdHoc, teams }: AddChecklistDialogProps) => {
  const { templates, loading } = useChecklistTemplates();
  const [tab, setTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("none");
  const [submitting, setSubmitting] = useState(false);

  // Ad-hoc state
  const [adHocName, setAdHocName] = useState("");
  const [adHocItems, setAdHocItems] = useState<AdHocItem[]>([
    { title: "", description: "", is_required: false, scope: "shared" },
  ]);

  const resetForm = () => {
    setSelectedTemplate("");
    setSelectedTeam("none");
    setAdHocName("");
    setAdHocItems([{ title: "", description: "", is_required: false, scope: "shared" }]);
    setTab("template");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const teamId = selectedTeam === "none" ? undefined : selectedTeam;
      if (tab === "template") {
        await onAddFromTemplate(selectedTemplate, teamId);
      } else {
        const validItems = adHocItems.filter((i) => i.title.trim());
        if (!adHocName.trim() || validItems.length === 0) return;
        await onAddAdHoc(adHocName.trim(), validItems, teamId);
      }
      handleClose();
    } catch {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setAdHocItems([...adHocItems, { title: "", description: "", is_required: false, scope: "shared" }]);
  };

  const removeItem = (idx: number) => {
    setAdHocItems(adHocItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof AdHocItem, value: any) => {
    const updated = [...adHocItems];
    (updated[idx] as any)[field] = value;
    setAdHocItems(updated);
  };

  const canSubmitTemplate = !!selectedTemplate;
  const canSubmitAdHoc = adHocName.trim() && adHocItems.some((i) => i.title.trim());

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Checklist</DialogTitle>
        </DialogHeader>

        {/* Team selector */}
        {teams.length > 0 && (
          <div className="space-y-2">
            <Label>Vincular a equipe (opcional)</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Evento inteiro</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="template" className="flex-1">De Template</TabsTrigger>
            <TabsTrigger value="adhoc" className="flex-1">Criar Avulso</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4 mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum template criado. Crie em Configurações de Eventos.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplate === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{t.items.length} itens</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="adhoc" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome do Checklist *</Label>
              <Input value={adHocName} onChange={(e) => setAdHocName(e.target.value)} placeholder="Ex: Preparação do som" />
            </div>

            <div className="space-y-3">
              <Label>Itens</Label>
              {adHocItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(idx, "title", e.target.value)}
                      placeholder="Título do item"
                      className="flex-1"
                    />
                    {adHocItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="shrink-0 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Descrição (opcional)"
                  />
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={item.is_required}
                        onCheckedChange={(v) => updateItem(idx, "is_required", !!v)}
                      />
                      <span className="text-xs text-muted-foreground">Obrigatório</span>
                    </div>
                    <Select value={item.scope} onValueChange={(v) => updateItem(idx, "scope", v)}>
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
              <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar item
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (tab === "template" ? !canSubmitTemplate : !canSubmitAdHoc)}
          >
            {submitting ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
