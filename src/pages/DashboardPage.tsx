import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Calendar, CheckSquare, Trophy, Users, ArrowRightCircle,
  Clock, MapPin, Star, TrendingUp, AlertTriangle, Medal,
  CalendarDays, ListChecks,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useMySchedule } from "@/hooks/useMySchedule";
import { useGamification } from "@/hooks/useGamification";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfile } from "@/hooks/useProfile";
import { Link, useNavigate } from "react-router-dom";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AttendanceHistory } from "@/components/dashboard/AttendanceHistory";

const MEDAL_STYLES = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-muted text-muted-foreground border-muted-foreground/30",
  "bg-accent/20 text-accent-foreground border-accent/30",
];
const MEDAL_LABELS = ["🥇", "🥈", "🥉"];

const DashboardPage = () => {
  const { schedule, loading: scheduleLoading } = useMySchedule();
  const { isActive: gamActive, myPoints, currentLevel, ranking, levels } = useGamification();
  const {
    upcomingEvents, pendingChecklists, totalUsers, eventsThisMonth,
    pendingSubstitutions, attendanceChart, topPerformers, topAbsences,
    loading: statsLoading,
  } = useDashboardStats();
  const { isAdmin } = usePermissions();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const nextEvents = schedule.slice(0, 3);
  const loading = scheduleLoading || statsLoading;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const nextLevel = levels.find((l) => l.min_points > myPoints);
  const progressPercent = nextLevel
    ? Math.min(100, Math.round((myPoints / nextLevel.min_points) * 100))
    : 100;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={`${getGreeting()}, ${profile?.name?.split(" ")[0] ?? ""} 👋`}
          description="Resumo do que está acontecendo"
        />

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} hasHeader={false} lines={2} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-fade">
            {isAdmin && (
              <>
                <StatCard icon={Users} label="Usuários ativos" value={totalUsers} />
                <StatCard icon={Calendar} label="Eventos no mês" value={eventsThisMonth} />
                <StatCard
                  icon={AlertTriangle}
                  label="Substituições"
                  value={pendingSubstitutions}
                  onClick={() => navigate("/admin/substitutions")}
                  iconClassName="bg-destructive/10"
                />
              </>
            )}
            {gamActive && (
              <StatCard icon={TrendingUp} label="Meus pontos" value={myPoints} />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* My Next Events */}
          {loading ? (
            <SkeletonCard lines={4} />
          ) : (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Próximos Eventos
                  </CardTitle>
                  <Link to="/my-schedule" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Ver todos <ArrowRightCircle className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {nextEvents.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="Nenhum evento próximo" description="Você será notificado quando for escalado" className="py-6" />
                ) : (
                  <div className="space-y-2 stagger-fade">
                    {nextEvents.map((item: any) => {
                      const event = item.event_teams?.events;
                      if (!event) return null;
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                          {event.event_types?.color && (
                            <div className="w-1 h-10 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: event.event_types.color }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground break-words line-clamp-2">{event.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.start_date), "dd/MM · HH:mm", { locale: ptBR })}
                              {event.location && (
                                <>
                                  <MapPin className="h-3 w-3 ml-1" />
                                  <span className="truncate">{event.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant={item.status === "confirmado" ? "default" : "outline"} className="text-xs shrink-0">
                            {item.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Checklists */}
          {loading ? (
            <SkeletonCard lines={4} />
          ) : (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  Tarefas Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingChecklists.length === 0 ? (
                  <EmptyState icon={ListChecks} title="Tudo em dia! ✅" description="Nenhuma tarefa pendente" className="py-6" />
                ) : (
                  <div className="space-y-2 stagger-fade">
                    {pendingChecklists.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-destructive/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{item.event_checklist_items?.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.event_checklist_items?.event_checklists?.events?.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gamification */}
          {gamActive && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Minha Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{myPoints}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                  {currentLevel && (
                    <div className="flex-1 space-y-2">
                      <Badge variant="secondary" className="text-sm">
                        {currentLevel.icon && <span className="mr-1">{currentLevel.icon}</span>}
                        {currentLevel.name}
                      </Badge>
                      {nextLevel && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Próximo: {nextLevel.name}</span>
                            <span>{myPoints}/{nextLevel.min_points}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ranking */}
          {gamActive && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <EmptyState icon={Trophy} title="Sem dados ainda" className="py-6" />
                ) : (
                  <div className="space-y-1 stagger-fade">
                    {ranking.slice(0, 5).map((r, i) => (
                      <div
                        key={r.userId}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                          i < 3 ? "bg-muted/30" : ""
                        } ${r.userId === profile?.id ? "ring-1 ring-primary/30" : ""}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${
                          i < 3 ? MEDAL_STYLES[i] : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {i < 3 ? MEDAL_LABELS[i] : i + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={r.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {r.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{r.name}</span>
                          {r.userId === profile?.id && (
                            <span className="text-xs text-primary">Você</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-primary">{r.total} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin: Attendance Chart */}
          {isAdmin && attendanceChart.length > 0 && (
            <Card className="lg:col-span-2 transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Presença nos Últimos 6 Meses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={attendanceChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="presente" name="Presentes" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="ausente" name="Ausentes" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Admin: Top Performers */}
          {isAdmin && topPerformers.length > 0 && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Medal className="h-4 w-4 text-primary" />
                  Mais Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 stagger-fade">
                  {topPerformers.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-1.5">
                      <span className={`text-sm font-bold w-5 text-center ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                        {i < 3 ? MEDAL_LABELS[i] : i + 1}
                      </span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm text-foreground truncate">{u.name}</span>
                      <Badge variant="secondary" className="text-xs">{u.count} presenças</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin: Top Absences */}
          {isAdmin && topAbsences.length > 0 && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Mais Faltas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 stagger-fade">
                  {topAbsences.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 p-1.5">
                      <span className="text-sm font-bold w-5 text-center text-muted-foreground">{i + 1}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                          {u.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm text-foreground truncate">{u.name}</span>
                      <Badge variant="destructive" className="text-xs">{u.count} faltas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
