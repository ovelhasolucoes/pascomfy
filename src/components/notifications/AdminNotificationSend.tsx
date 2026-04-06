import { useState } from "react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

export function AdminNotificationSend() {
  const { sendNotification, isSending } = useAdminNotifications();
  const { members = [] } = useCompanyMembers();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"escala" | "evento" | "aviso" | "sistema">("aviso");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedUsers(checked ? members.map((m: { id: string }) => m.id) : []);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = () => {
    if (!title || !message || selectedUsers.length === 0) return;
    sendNotification({ title, message, type, userIds: selectedUsers });
    setTitle("");
    setMessage("");
    setSelectedUsers([]);
    setSelectAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Enviar Notificação</CardTitle>
        <CardDescription>Envie notificações para membros da sua equipe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da notificação" />
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensagem..." />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aviso">Aviso</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="escala">Escala</SelectItem>
              <SelectItem value="sistema">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Destinatários ({selectedUsers.length})</Label>
          <div className="flex items-center gap-2 mb-2">
            <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} id="select-all" />
            <Label htmlFor="select-all" className="text-sm">Selecionar todos</Label>
          </div>
          <ScrollArea className="max-h-[200px] border rounded-md p-2">
            {members.map((m: { id: string; name: string; email: string }) => (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={selectedUsers.includes(m.id)}
                  onCheckedChange={() => toggleUser(m.id)}
                />
                <span className="text-sm">{m.name}</span>
                <span className="text-xs text-muted-foreground">({m.email})</span>
              </div>
            ))}
          </ScrollArea>
        </div>
        <Button onClick={handleSend} disabled={isSending || !title || !message || selectedUsers.length === 0} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          {isSending ? "Enviando..." : "Enviar Notificação"}
        </Button>
      </CardContent>
    </Card>
  );
}
