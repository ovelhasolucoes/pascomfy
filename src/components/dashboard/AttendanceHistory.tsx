import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useVolunteerStats } from "@/hooks/useVolunteerStats";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AttendanceHistory() {
  const { totalPresent, totalAbsent, attendanceRate, recentAttendance, scheduledCount, loading } = useVolunteerStats();

  if (loading) return null;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Meu Histórico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{scheduledCount}</p>
            <p className="text-xs text-muted-foreground">Escalações</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-500">{totalPresent}</p>
            <p className="text-xs text-muted-foreground">Presenças</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-destructive">{totalAbsent}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
        </div>

        {/* Attendance rate */}
        {(totalPresent + totalAbsent) > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> Taxa de presença
              </span>
              <span className="font-semibold text-foreground">{attendanceRate}%</span>
            </div>
            <Progress value={attendanceRate} className="h-2" />
          </div>
        )}

        {/* Recent records */}
        {recentAttendance.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Sem registros"
            description="Seu histórico aparecerá aqui"
            className="py-4"
          />
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentAttendance.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                {r.status === "presente" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.events?.title ?? "Evento"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.checkin_at
                      ? format(new Date(r.checkin_at), "dd/MM/yyyy · HH:mm", { locale: ptBR })
                      : "—"}
                  </p>
                </div>
                <Badge variant={r.status === "presente" ? "default" : "destructive"} className="text-xs shrink-0">
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
