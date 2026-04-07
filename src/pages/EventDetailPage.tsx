import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, MapPin, Clock, Plus, Zap, Users, ClipboardList, UserCheck, Trash2, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventTeamCard } from "@/components/events/EventTeamCard";
import { AddTeamDialog } from "@/components/events/AddTeamDialog";
import { AddMemberDialog } from "@/components/events/AddMemberDialog";
import { ChecklistSection } from "@/components/checklist/ChecklistSection";
import { AddChecklistDialog } from "@/components/checklist/AddChecklistDialog";
import { EditEventDialog } from "@/components/events/EditEventDialog";
import { AttendanceButton } from "@/components/attendance/AttendanceButton";
import { AttendanceList } from "@/components/attendance/AttendanceList";
import { useEvents } from "@/hooks/useEvents";
import { useEventTeams } from "@/hooks/useEventTeams";
import { useEventMembers } from "@/hooks/useEventMembers";
import { usePermissions } from "@/hooks/usePermissions";
import { useRealtimeChecklist } from "@/hooks/useRealtimeChecklist";
import { useEventChecklistManage } from "@/hooks/useEventChecklistManage";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = usePermissions();
  const { profile } = useProfile();
  const canEditScale = hasPermission("editar_escala");

  const { events, loading: eventsLoading } = useEvents();
  const event = events.find((e) => e.id === id);

  const { teams, loading: teamsLoading, createTeam, deleteTeam } = useEventTeams(id);
  const { addMember, updateMember, removeMember } = useEventMembers(id);
  const { addChecklistFromTemplate, addAdHocChecklist, deleteChecklist } = useEventChecklistManage(id);
  useRealtimeChecklist(id);

  const [addChecklistOpen, setAddChecklistOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);

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
    return (
      <AppLayout>
        <div className="space-y-6">
          <SkeletonCard hasHeader={false} lines={3} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={4} />
        </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
        <EmptyState title="Evento não encontrado" description="Este evento pode ter sido removido." />
      </AppLayout>
    );
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
      <div className="space-y-6 animate-fade-in">
        {/* Header Banner */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/events")} className="mt-0.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
              <Badge variant={event.status === "ativo" ? "default" : "destructive"}>{event.status}</Badge>
            </div>
            {event.event_types && (
              <div className="flex items-center gap-2 mt-1">
                {event.event_types.color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: event.event_types.color }} />}
                <span className="text-sm text-muted-foreground">{event.event_types.name}</span>
              </div>
            )}
          </div>
          {(isAdmin || event.created_by === profile?.id) && (
            <Button variant="ghost" size="icon" onClick={() => setEditEventOpen(true)} className="mt-0.5 shrink-0">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Info Cards */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                {format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {event.end_date && ` — ${format(new Date(event.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {event.location}
                </div>
              )}
            </div>
            {event.description && (
              <>
                <Separator className="my-3" />
                <p className="text-foreground text-sm">{event.description}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Teams & Scale */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Equipes & Escala
            </h2>
            {canEditScale && (
              <Button onClick={() => setAddTeamOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Equipe
              </Button>
            )}
          </div>

          {teams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhuma equipe criada"
              description="Adicione equipes para montar a escala do evento."
            >
              {canEditScale && (
                <Button onClick={() => setAddTeamOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Criar Equipe
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-4 stagger-fade">
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

        <Separator />

        {/* Attendance */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Presença
          </h2>
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

        <Separator />

        {/* Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Checklist
            </h2>
            {canEditScale && (
              <Button onClick={() => setAddChecklistOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Checklist
              </Button>
            )}
          </div>
          <ChecklistSection eventId={id!} canEdit={canEditScale} onDeleteChecklist={(clId) => {
            deleteChecklist.mutateAsync(clId).then(() => toast.success("Checklist removido")).catch((e: any) => toast.error(e.message));
          }} />
        </div>

        {/* Focus Mode */}
        <Button
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-200"
          size="lg"
          onClick={() => navigate(`/events/${id}/live`)}
        >
          <Zap className="h-5 w-5 mr-2" /> Modo Foco
        </Button>

        <AddTeamDialog open={addTeamOpen} onClose={() => setAddTeamOpen(false)} onAdd={handleAddTeam} />
        <AddMemberDialog
          open={!!addMemberTeamId}
          onClose={() => setAddMemberTeamId(null)}
          onAdd={handleAddMember}
          existingMemberIds={existingMemberIds}
        />
        <AddChecklistDialog
          open={addChecklistOpen}
          onClose={() => setAddChecklistOpen(false)}
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          onAddFromTemplate={async (templateId, teamId) => {
            await addChecklistFromTemplate.mutateAsync({ templateId, eventTeamId: teamId });
            toast.success("Checklist adicionado!");
          }}
          onAddAdHoc={async (name, items, teamId) => {
            await addAdHocChecklist.mutateAsync({ name, items, eventTeamId: teamId });
            toast.success("Checklist criado!");
          }}
        />
      </div>
    </AppLayout>
  );
};

export default EventDetailPage;
