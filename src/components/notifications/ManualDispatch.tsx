import { useState, useCallback } from "react";
import { useAutomationQueue } from "@/hooks/useAutomationQueue";
import { useCompanyMembers } from "@/hooks/useCompanyMembers";
import { useEvents } from "@/hooks/useEvents";
import { useEventTeams } from "@/hooks/useEventTeams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Users, FileText, MessageSquare, Bell, Smartphone, Loader2 } from "lucide-react";

type TargetMode = "all" | "event" | "team" | "custom";

export function ManualDispatch() {
  const { dispatch, isDispatching, buildGroupMessage } = useAutomationQueue();
  const { members = [] } = useCompanyMembers();
  const { events = [] } = useEvents();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [buildingMsg, setBuildingMsg] = useState(false);

  const { teams } = useEventTeams(selectedEvent || undefined);

  // Compute resolved user list based on target mode
  const resolvedUsers = useCallback(() => {
    if (targetMode === "all") return members.map((m: { id: string }) => m.id);
    if (targetMode === "custom") return selectedUsers;
    if (targetMode === "team" && selectedTeam) {
      const team = teams.find((t) => t.id === selectedTeam);
      return team?.event_team_members?.map((m) => m.user_id) || [];
    }
    if (targetMode === "event" && selectedEvent) {
      const allMembers = teams.flatMap((t) => t.event_team_members?.map((m) => m.user_id) || []);
      return [...new Set(allMembers)];
    }
    return [];
  }, [targetMode, members, selectedUsers, selectedTeam, selectedEvent, teams]);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const handleBuildGroup = async () => {
    if (!selectedEvent) return;
    setBuildingMsg(true);
    try {
      const msg = await buildGroupMessage(selectedEvent);
      setMessage(msg);
      if (!title) setTitle("Escala do Evento");
    } finally {
      setBuildingMsg(false);
    }
  };

  const handleSend = () => {
    const users = resolvedUsers();
    if (!title || !message || users.length === 0) return;
    dispatch({ userIds: users, channel, title, message, metadata: { trigger: "manual", ...(selectedEvent ? { event_id: selectedEvent } : {}) } });
    setTitle("");
    setMessage("");
    setSelectedUsers([]);
  };

  const userCount = resolvedUsers().length;

  const channelIcon = channel === "whatsapp" ? <MessageSquare className="h-4 w-4" /> : channel === "push" ? <Smartphone className="h-4 w-4" /> : <Bell className="h-4 w-4" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Target */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Destinatários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Público</Label>
            <Select value={targetMode} onValueChange={(v) => { setTargetMode(v as TargetMode); setSelectedEvent(""); setSelectedTeam(""); setSelectedUsers([]); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos da empresa</SelectItem>
                <SelectItem value="event">Por evento</SelectItem>
                <SelectItem value="team">Por equipe</SelectItem>
                <SelectItem value="custom">Selecionar membros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(targetMode === "event" || targetMode === "team") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Evento</Label>
              <Select value={selectedEvent} onValueChange={(v) => { setSelectedEvent(v); setSelectedTeam(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(events as Array<{ id: string; title: string }>).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetMode === "team" && selectedEvent && (
            <div className="space-y-1.5">
              <Label className="text-xs">Equipe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.event_team_members?.length || 0})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetMode === "custom" && (
            <ScrollArea className="max-h-[250px] border rounded-md p-2">
              {members.map((m: { id: string; name: string; email: string }) => (
                <div key={m.id} className="flex items-center gap-2 py-1">
                  <Checkbox checked={selectedUsers.includes(m.id)} onCheckedChange={() => toggleUser(m.id)} />
                  <span className="text-xs">{m.name}</span>
                </div>
              ))}
            </ScrollArea>
          )}

          <Badge variant="secondary" className="text-xs w-full justify-center">
            {userCount} destinatário{userCount !== 1 ? "s" : ""}
          </Badge>
        </CardContent>
      </Card>

      {/* Right: Message */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4" />Mensagem</CardTitle>
          <CardDescription className="text-xs">Compose e envie via o canal escolhido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da mensagem" />
            </div>
          </div>

          {selectedEvent && (
            <Button variant="outline" size="sm" onClick={handleBuildGroup} disabled={buildingMsg}>
              <FileText className="h-4 w-4 mr-1" />
              {buildingMsg ? "Montando..." : "Gerar mensagem da escala"}
            </Button>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Conteúdo da mensagem..." rows={8} />
          </div>

          <Button onClick={handleSend} disabled={isDispatching || !title || !message || userCount === 0} className="w-full">
            {isDispatching ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <>{channelIcon}<span className="ml-2">Enviar para {userCount} pessoa{userCount !== 1 ? "s" : ""}</span></>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
