import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamTemplates } from "@/hooks/useTeamTemplates";

interface AddTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (team: { name: string; description?: string; color?: string; templateId?: string }) => void;
}

export function AddTeamDialog({ open, onClose, onAdd }: AddTeamDialogProps) {
  const { templates } = useTeamTemplates();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [templateId, setTemplateId] = useState("");

  const handleAddManual = () => {
    if (!name) return;
    onAdd({ name, description: description || undefined, color });
    reset();
  };

  const handleAddFromTemplate = () => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    onAdd({ name: tpl.name, description: tpl.description || undefined, color: tpl.color || undefined, templateId: tpl.id });
    reset();
  };

  const reset = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
    setTemplateId("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Equipe</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="template">
          <TabsList className="w-full">
            <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4 mt-4">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      {t.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />}
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleAddFromTemplate} disabled={!templateId}>Adicionar</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da equipe" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-20" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleAddManual} disabled={!name}>Criar</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
