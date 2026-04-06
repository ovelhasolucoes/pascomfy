import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, UserPlus } from "lucide-react";
import { TeamMemberRow } from "./TeamMemberRow";
import type { TeamWithMembers } from "@/hooks/useEventTeams";

interface EventTeamCardProps {
  team: TeamWithMembers;
  canEdit: boolean;
  eventId: string;
  onAddMember: (teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onUpdateMember: (id: string, field: string, value: string) => void;
  onRemoveMember: (id: string) => void;
}

export function EventTeamCard({ team, canEdit, onAddMember, onDeleteTeam, onUpdateMember, onRemoveMember }: EventTeamCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {team.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />}
            <CardTitle className="text-base">{team.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">{team.event_team_members.length} membros</Badge>
          </div>
          {canEdit && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onAddMember(team.id)}>
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDeleteTeam(team.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
      </CardHeader>
      <CardContent>
        {team.event_team_members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum membro escalado</p>
        ) : (
          <div className="space-y-2">
            {team.event_team_members.map((member) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                canEdit={canEdit}
                onUpdate={onUpdateMember}
                onRemove={onRemoveMember}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
