import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Calendar, CheckSquare, Clock, MapPin, ArrowRight,
  CalendarDays, ListChecks, Star, Download,
} from "lucide-react";
import { useMySchedule } from "@/hooks/useMySchedule";
import { useGamification } from "@/hooks/useGamification";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfile } from "@/hooks/useProfile";
import { Link, useNavigate } from "react-router-dom";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { schedule, loading: scheduleLoading } = useMySchedule();
  const { isActive: gamActive, myPoints, currentLevel } = useGamification();
  const {
    eventsThisMonth, pendingSubstitutions,
    loading: statsLoading,
  } = useDashboardStats();
  const { isAdmin, isSuperAdmin, loading: permLoading } = usePermissions();
  const { profile } = useProfile();

  // Super Admin é redirecionado direto para o painel dedicado
  useEffect(() => {
    if (!permLoading && isSuperAdmin) {
      navigate("/superadmin", { replace: true });
    }
  }, [permLoading, isSuperAdmin, navigate]);

  const nextEvents = schedule.slice(0, 3);
  const loading = scheduleLoading || statsLoading;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleExportCalendar = () => {
    if (schedule.length === 0) {
      toast.info("Nenhum evento para exportar");
      return;
    }
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pascomfy//PT"];
    schedule.forEach((item: any) => {
      const event = item.event_teams?.events;
      if (!event) return;
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      lines.push("BEGIN:VEVENT", `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${event.title}`);
      if (event.location) lines.push(`LOCATION:${event.location}`);
      lines.push(`UID:${item.id}@pascomfy`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `escala-${format(new Date(), "yyyy-MM")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendário exportado!");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {getGreeting()}, {profile?.name?.split(" ")[0] ?? ""} 👋
          </h1>
          {gamActive && currentLevel && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-primary" />
              {myPoints} pontos · {currentLevel.icon} {currentLevel.name}
            </p>
          )}
        </div>

        {/* Admin stats */}
        {isAdmin && !loading && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Calendar} label="Eventos no mês" value={eventsThisMonth} />
            <StatCard
              icon={CheckSquare}
              label="Substituições"
              value={pendingSubstitutions}
              onClick={() => navigate("/admin/substitutions")}
            />
          </div>
        )}

        {/* Next Events - main focus */}
        {loading ? (
          <SkeletonCard lines={4} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Próximos Eventos</h2>
              <Link to="/my-schedule" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver agenda <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {nextEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nenhum evento próximo"
                description="Você será notificado quando for escalado"
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                {nextEvents.map((item: any) => {
                  const event = item.event_teams?.events;
                  if (!event) return null;
                  return (
                    <Card
                      key={item.id}
                      className="cursor-pointer active:scale-[0.99] transition-transform"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {event.event_types?.color && (
                            <div className="w-1 h-12 rounded-full shrink-0" style={{ backgroundColor: event.event_types.color }} />
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-semibold text-foreground line-clamp-1">{event.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(event.start_date), "dd/MM · HH:mm", { locale: ptBR })}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant={item.status === "confirmado" ? "default" : "outline"} className="text-xs shrink-0">
                            {item.status === "confirmado" ? "Confirmado" : "Pendente"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick inline actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate("/my-schedule")}>
            <CalendarDays className="h-4 w-4 mr-1.5" /> Minha Agenda
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handleExportCalendar}>
            <Download className="h-4 w-4 mr-1.5" /> Exportar .ics
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
