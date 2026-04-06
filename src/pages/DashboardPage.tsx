import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar, CheckSquare, Trophy, Users, ArrowRightCircle,
  Clock, MapPin, Star, TrendingUp, AlertTriangle,
} from "lucide-react";
import { useMySchedule } from "@/hooks/useMySchedule";
import { useGamification } from "@/hooks/useGamification";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const { schedule } = useMySchedule();
  const { isActive: gamActive, myPoints, currentLevel, ranking } = useGamification();
  const { upcomingEvents, pendingChecklists, totalUsers, eventsThisMonth, pendingSubstitutions } = useDashboardStats();
  const { isAdmin } = usePermissions();
  const { profile } = useProfile();

  const nextEvents = schedule.slice(0, 3);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">Resumo do que está acontecendo</p>
        </div>

        {/* Stats Cards for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Usuários ativos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{eventsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Eventos no mês</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingSubstitutions}</p>
                  <p className="text-xs text-muted-foreground">Substituições</p>
                </div>
              </CardContent>
            </Card>
            {gamActive && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{myPoints}</p>
                    <p className="text-xs text-muted-foreground">Meus pontos</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* My Next Events */}
          <Card>
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
            <CardContent className="space-y-2">
              {nextEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento próximo</p>
              ) : (
                nextEvents.map((item: any) => {
                  const event = item.event_teams?.events;
                  if (!event) return null;
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      {event.event_types?.color && (
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.event_types.color }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
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
                })
              )}
            </CardContent>
          </Card>

          {/* Pending Checklists */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Tarefas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingChecklists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tudo em dia! ✅</p>
              ) : (
                pendingChecklists.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.event_checklist_items?.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.event_checklist_items?.event_checklists?.events?.title}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Gamification - Points & Level */}
          {gamActive && !isAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Minha Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{myPoints}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                  {currentLevel && (
                    <div className="flex-1">
                      <Badge variant="secondary" className="text-sm">
                        {currentLevel.icon && <span className="mr-1">{currentLevel.icon}</span>}
                        {currentLevel.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ranking */}
          {gamActive && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ranking.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem dados ainda</p>
                ) : (
                  ranking.slice(0, 5).map((r, i) => (
                    <div key={r.userId} className="flex items-center gap-3 p-1.5">
                      <span className={`text-sm font-bold w-5 text-center ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={r.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {r.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm text-foreground truncate">{r.name}</span>
                      <span className="text-sm font-medium text-primary">{r.total} pts</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
