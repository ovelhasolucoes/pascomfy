import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, MapPin, Clock, Plus, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventTeamCard } from "@/components/events/EventTeamCard";
import { AddTeamDialog } from "@/components/events/AddTeamDialog";
import { AddMemberDialog } from "@/components/events/AddMemberDialog";
import { ChecklistSection } from "@/components/checklist/ChecklistSection";
import { AttendanceButton } from "@/components/attendance/AttendanceButton";
import { AttendanceList } from "@/components/attendance/AttendanceList";
import { useEvents } from "@/hooks/useEvents";
import { useEventTeams } from "@/hooks/useEventTeams";
import { useEventMembers } from "@/hooks/useEventMembers";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtimeChecklist } from "@/hooks/useRealtimeChecklist";
import { toast } from "sonner";

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEditScale = hasPermission("editar_escala");

  const { events, loading: eventsLoading } = useEvents();
  const event = events.find((e) => e.id === id);

  const { teams, loading: teamsLoading, createTeam, deleteTeam } = useEventTeams(id);
  const { addMember, updateMember, removeMember } = useEventMembers(id);
  useRealtimeChecklist(id);

  // Collect scaled user info for admin attendance view
  const scaledUserIds = teams.flatMap((t) =>
    t.event_team_members?.map((m: any) => m.user_id) ?? []
  );
  const scaledUserNames: Record<string, string> = {};
  teams.forEach((t) =>
    t.event_team_members?.forEach((m: any) => {
      if (m.profiles?.name) scaledUserNames[m.user_id] = m.profiles.name;
    })
  );

  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);

  const selectedTeam = teams.find((t) => t.id === addMemberTeamId);
  const existingMemberIds = selectedTeam?.event_team_members.map((m) => m.user_id) ?? [];

  if (eventsLoading || teamsLoading) {
    return <AppLayout><p className="text-muted-foreground py-12 text-center">Carregando...</p></AppLayout>;
  }

  if (!event) {
    return <AppLayout><p className="text-muted-foreground py-12 text-center">Evento não encontrado</p></AppLayout>;
  }

  const handleAddTeam = async (team: { name: string; description?: string; color?: string; templateId?: string }) => {
    try {
      await createTeam.mutateAsync({
        event_id: id!,
        name: team.name,
        description: team.description || null,
        color: team.color || null,
        template_id: team.templateId || null,
      });
      toast.success("Equipe adicionada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddMember = async (userId: string, roleName: string) => {
    try {
      await addMember.mutateAsync({ eventTeamId: addMemberTeamId!, userId, roleName: roleName || undefined });
      toast.success("Membro adicionado!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateMember = async (memberId: string, field: string, value: string) => {
    try {
      if (field === "status") {
        await updateMember.mutateAsync({ id: memberId, status: value });
      } else if (field === "roleName") {
        await updateMember.mutateAsync({ id: memberId, roleName: value });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember.mutateAsync(memberId);
      toast.success("Membro removido");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam.mutateAsync(teamId);
      toast.success("Equipe removida");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/events")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
              <Badge variant={event.status === "ativo" ? "default" : "destructive"}>{event.status}</Badge>
            </div>
            {event.event_types && (
              <div className="flex items-center gap-2 mt-1">
                {event.event_types.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.event_types.color }} />}
                <span className="text-sm text-muted-foreground">{event.event_types.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {event.end_date && ` — ${format(new Date(event.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>
          )}
        </div>

        {event.description && <p className="text-foreground">{event.description}</p>}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Equipes & Escala</h2>
            {canEditScale && (
              <Button onClick={() => setAddTeamOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Equipe
              </Button>
            )}
          </div>

          {teams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma equipe criada. Adicione equipes para montar a escala.</p>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => (
                <EventTeamCard
                  key={team.id}
                  team={team}
                  canEdit={canEditScale}
                  eventId={id!}
                  onAddMember={(teamId) => setAddMemberTeamId(teamId)}
                  onDeleteTeam={handleDeleteTeam}
                  onUpdateMember={handleUpdateMember}
                  onRemoveMember={handleRemoveMember}
                />
              ))}
            </div>
          )}
        </div>

        {/* Presença */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Presença</h2>
          <AttendanceButton eventId={id!} eventStartDate={event.start_date} />
          {canEditScale && scaledUserIds.length > 0 && (
            <AttendanceList
              eventId={id!}
              eventStartDate={event.start_date}
              scaledUserIds={[...new Set(scaledUserIds)]}
              scaledUserNames={scaledUserNames}
            />
          )}
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Checklist</h2>
          <ChecklistSection eventId={id!} />
        </div>

        {/* Modo Foco */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/events/${id}/live`)}
        >
          <Zap className="h-4 w-4 mr-2" /> Modo Foco
        </Button>

        <AddTeamDialog open={addTeamOpen} onClose={() => setAddTeamOpen(false)} onAdd={handleAddTeam} />
        <AddMemberDialog
          open={!!addMemberTeamId}
          onClose={() => setAddMemberTeamId(null)}
          onAdd={handleAddMember}
          existingMemberIds={existingMemberIds}
        />
      </div>
    </AppLayout>
  );
};

export default EventDetailPage;
