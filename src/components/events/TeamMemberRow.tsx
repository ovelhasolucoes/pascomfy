import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type MemberWithProfile = Tables<"event_team_members"> & { profiles: Tables<"profiles"> };

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  confirmado: { label: "Confirmado", variant: "default" },
  ausente: { label: "Ausente", variant: "destructive" },
  substituido: { label: "Substituído", variant: "secondary" },
};

interface TeamMemberRowProps {
  member: MemberWithProfile;
  canEdit: boolean;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
}

export function TeamMemberRow({ member, canEdit, onUpdate, onRemove }: TeamMemberRowProps) {
  const sc = statusConfig[member.status] || statusConfig.pendente;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{member.profiles?.name || "—"}</p>
        {member.role_name && <p className="text-xs text-muted-foreground">{member.role_name}</p>}
      </div>

      {canEdit ? (
        <Select value={member.status} onValueChange={(v) => onUpdate(member.id, "status", v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="ausente">Ausente</SelectItem>
            <SelectItem value="substituido">Substituído</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Badge variant={sc.variant}>{sc.label}</Badge>
      )}

      {canEdit && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(member.id)}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
