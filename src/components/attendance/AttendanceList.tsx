import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";
import { useEventAttendance } from "@/hooks/useEventAttendance";

interface AttendanceListProps {
  eventId: string;
  eventStartDate: string;
  /** All user IDs that are part of event teams */
  scaledUserIds: string[];
  scaledUserNames: Record<string, string>;
}

export const AttendanceList = ({ eventId, eventStartDate, scaledUserIds, scaledUserNames }: AttendanceListProps) => {
  const { attendance, loading } = useEventAttendance(eventId, eventStartDate);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const checkedInIds = new Set(attendance.map((a) => a.user_id));

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Presença ({attendance.length}/{scaledUserIds.length})
      </h3>
      <div className="space-y-1">
        {scaledUserIds.map((uid) => {
          const record = attendance.find((a) => a.user_id === uid);
          const isPresent = checkedInIds.has(uid);
          return (
            <div key={uid} className="flex items-center gap-2 text-sm py-1">
              {isPresent ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={isPresent ? "text-foreground" : "text-muted-foreground"}>
                {scaledUserNames[uid] || "Membro"}
              </span>
              {record?.checkin_at && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(record.checkin_at), "HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
