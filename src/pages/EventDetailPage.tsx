import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, MapPin, Clock, Plus, Zap, Users, ClipboardList, UserCheck, Pencil, ScanLine } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventTeamCard } from "@/components/events/EventTeamCard";
import { AddTeamDialog } from "@/components/events/AddTeamDialog";
import { AddMemberDialog } from "@/components/events/AddMemberDialog";
import { ChecklistSection } from "@/components/checklist/ChecklistSection";
import { AddChecklistDialog } from "@/components/checklist/AddChecklistDialog";
import { EditEventDialog } from "@/components/events/EditEventDialog";
import { AttendanceButton } from "@/components/attendance/AttendanceButton";
import { EventQRCode } from "@/components/checkin/EventQRCode";
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
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);

  const scaledUserIds = teams.flatMap((t) => t.event_team_members?.map((m: any) => m.user_id) ?? []);
  const scaledUserNames: Record<string, string> = {};
  teams.forEach((t) => t.event_team_members?.forEach((m: any) => {
    if (m.profiles?.name) scaledUserNames[m.user_id] = m.profiles.name;
  }));

  const selectedTeam = teams.find((t) => t.id === addMemberTeamId);
  const existingMemberIds = selectedTeam?.event_team_members.map((m) => m.user_id) ?? [];

  if (eventsLoading || teamsLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <SkeletonCard hasHeader={false} lines={3} />
          <SkeletonCard lines={5} />
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
      await createTeam.mutateAsync({ event_id: id!, name: team.name, description: team.description || null, color: team.color || null, template_id: team.templateId || null });
      toast.success("Equipe adicionada!");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddMember = async (userId: string, roleName: string) => {
    try {
      await addMember.mutateAsync({ eventTeamId: addMemberTeamId!, userId, roleName: roleName || undefined });
      toast.success("Membro adicionado!");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUpdateMember = async (memberId: string, field: string, value: string) => {
    try {
      if (field === "status") await updateMember.mutateAsync({ id: memberId, status: value });
      else if (field === "roleName") await updateMember.mutateAsync({ id: memberId, roleName: value });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleRemoveMember = async (memberId: string) => {
    try { await removeMember.mutateAsync(memberId); toast.success("Membro removido"); } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try { await deleteTeam.mutateAsync(teamId); toast.success("Equipe removida"); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/events")} className="mt-0.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">{event.title}</h1>
              <Badge variant={event.status === "ativo" ? "default" : "destructive"}>{event.status}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(event.start_date), "dd/MM/yyyy · HH:mm", { locale: ptBR })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${id}/live`)} title="Modo Foco">
              <Zap className="h-4 w-4" />
            </Button>
            {(isAdmin || event.created_by === profile?.id) && (
              <Button variant="ghost" size="icon" onClick={() => setEditEventOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}

        {/* Tabs */}
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="teams" className="text-xs sm:text-sm">Equipes</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">Presença</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs sm:text-sm">Checklist</TabsTrigger>
            <TabsTrigger value="info" className="text-xs sm:text-sm">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="mt-4 space-y-4">
            {canEditScale && (
              <Button onClick={() => setAddTeamOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" /> Adicionar equipe
              </Button>
            )}
            {teams.length === 0 ? (
              <EmptyState icon={Users} title="Nenhuma equipe" description="Adicione equipes para montar a escala." />
            ) : (
              <div className="space-y-4">
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
          </TabsContent>

          <TabsContent value="attendance" className="mt-4 space-y-4">
            <div className="flex gap-2 flex-wrap">
              {(event as any).checkin_token && (
                <EventQRCode eventId={event.id} eventTitle={event.title} checkinToken={(event as any).checkin_token} />
              )}
              {canEditScale && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/events/${id}/scan`)}>
                  <ScanLine className="h-4 w-4 mr-1" /> Scanner
                </Button>
              )}
            </div>
            <AttendanceButton eventId={id!} eventStartDate={event.start_date} />
            {canEditScale && scaledUserIds.length > 0 && (
              <AttendanceList
                eventId={id!}
                eventStartDate={event.start_date}
                scaledUserIds={[...new Set(scaledUserIds)]}
                scaledUserNames={scaledUserNames}
              />
            )}
          </TabsContent>

          <TabsContent value="checklist" className="mt-4 space-y-4">
            {canEditScale && (
              <Button onClick={() => setAddChecklistOpen(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" /> Checklist
              </Button>
            )}
            <ChecklistSection eventId={id!} canEdit={canEditScale} onDeleteChecklist={(clId) => {
              deleteChecklist.mutateAsync(clId).then(() => toast.success("Checklist removido")).catch((e: any) => toast.error(e.message));
            }} />
          </TabsContent>

          <TabsContent value="info" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    {format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {event.end_date && ` — ${format(new Date(event.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {event.location}
                    </div>
                  )}
                  {event.event_types && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {event.event_types.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.event_types.color }} />}
                      {event.event_types.name}
                    </div>
                  )}
                </div>
                {event.description && <p className="text-sm text-foreground pt-2 border-t border-border">{event.description}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddTeamDialog open={addTeamOpen} onClose={() => setAddTeamOpen(false)} onAdd={handleAddTeam} />
        <AddMemberDialog open={!!addMemberTeamId} onClose={() => setAddMemberTeamId(null)} onAdd={handleAddMember} existingMemberIds={existingMemberIds} />
        <AddChecklistDialog
          open={addChecklistOpen}
          onClose={() => setAddChecklistOpen(false)}
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          onAddFromTemplate={async (templateId, teamId) => { await addChecklistFromTemplate.mutateAsync({ templateId, eventTeamId: teamId }); toast.success("Checklist adicionado!"); }}
          onAddAdHoc={async (name, items, teamId) => { await addAdHocChecklist.mutateAsync({ name, items, eventTeamId: teamId }); toast.success("Checklist criado!"); }}
        />
        {event && <EditEventDialog open={editEventOpen} onClose={() => setEditEventOpen(false)} event={event} />}
      </div>
    </AppLayout>
  );
};

export default EventDetailPage;
