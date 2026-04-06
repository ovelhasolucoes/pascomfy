import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (userId: string, roleName: string) => void;
  existingMemberIds: string[];
}

export function AddMemberDialog({ open, onClose, onAdd, existingMemberIds }: AddMemberDialogProps) {
  const { members } = useCompanyMembers();
  const [userId, setUserId] = useState("");
  const [roleName, setRoleName] = useState("");

  const available = members.filter((m) => !existingMemberIds.includes(m.id));

  const handleAdd = () => {
    if (!userId) return;
    onAdd(userId, roleName);
    setUserId("");
    setRoleName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Membro</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {available.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Função (opcional)</Label>
            <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Ex: Foto do altar" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={!userId}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
