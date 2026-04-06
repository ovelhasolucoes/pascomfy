import { useState } from "react";
import { useAutomationQueue } from "@/hooks/useAutomationQueue";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useEvents } from "@/hooks/useEvents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, FileText } from "lucide-react";

export function ManualDispatch() {
  const { dispatch, isDispatching, buildGroupMessage } = useAutomationQueue();
  const { members = [] } = useCompanyMembers();
  const { events = [] } = useEvents();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [buildingMsg, setBuildingMsg] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedUsers(checked ? members.map((m: { id: string }) => m.id) : []);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBuildGroup = async () => {
    if (!selectedEvent) return;
    setBuildingMsg(true);
    try {
      const msg = await buildGroupMessage(selectedEvent);
      setMessage(msg);
      if (!title) setTitle("Escala do Evento");
    } catch {
      // ignore
    } finally {
      setBuildingMsg(false);
    }
  };

  const handleSend = () => {
    if (!title || !message || selectedUsers.length === 0) return;
    dispatch({
      userIds: selectedUsers,
      channel,
      title,
      message,
      metadata: selectedEvent ? { event_id: selectedEvent, trigger: "manual" } : { trigger: "manual" },
    });
    setTitle("");
    setMessage("");
    setSelectedUsers([]);
    setSelectAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5" />Disparo Manual</CardTitle>
        <CardDescription>Envie mensagens via qualquer canal para membros selecionados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Canal de Envio</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Evento (opcional)</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {(events as Array<{ id: string; title: string }>).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedEvent && (
          <Button variant="outline" size="sm" onClick={handleBuildGroup} disabled={buildingMsg}>
            <FileText className="h-4 w-4 mr-1" />
            {buildingMsg ? "Montando..." : "Montar Mensagem de Grupo"}
          </Button>
        )}

        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da mensagem" />
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Conteúdo..." rows={6} />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Users className="h-4 w-4" />Destinatários ({selectedUsers.length})</Label>
          <div className="flex items-center gap-2 mb-1">
            <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} id="dispatch-all" />
            <Label htmlFor="dispatch-all" className="text-sm">Selecionar todos</Label>
          </div>
          <ScrollArea className="max-h-[180px] border rounded-md p-2">
            {members.map((m: { id: string; name: string; email: string }) => (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <Checkbox checked={selectedUsers.includes(m.id)} onCheckedChange={() => toggleUser(m.id)} />
                <span className="text-sm">{m.name}</span>
                <span className="text-xs text-muted-foreground">({m.email})</span>
              </div>
            ))}
          </ScrollArea>
        </div>

        <Button onClick={handleSend} disabled={isDispatching || !title || !message || selectedUsers.length === 0} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          {isDispatching ? "Enviando..." : `Enviar via ${channel === "in_app" ? "In-App" : channel === "push" ? "Push" : "WhatsApp"}`}
        </Button>
      </CardContent>
    </Card>
  );
}
