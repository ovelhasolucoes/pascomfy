import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, MapPin } from "lucide-react";
import { useMySchedule } from "@/hooks/useMySchedule";
import { useEventMembers } from "@/hooks/useEventMembers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  confirmado: { label: "Confirmado", variant: "default" },
  ausente: { label: "Ausente", variant: "destructive" },
  substituido: { label: "Substituído", variant: "secondary" },
};

const MySchedulePage = () => {
  const { schedule, loading } = useMySchedule();
  const { confirmPresence } = useEventMembers();

  const handleConfirm = async (memberId: string) => {
    try {
      await confirmPresence.mutateAsync(memberId);
      toast.success("Presença confirmada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
          <p className="text-muted-foreground">Eventos em que você está escalado</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        ) : schedule.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Você não está escalado em nenhum evento futuro.</p>
        ) : (
          <div className="grid gap-3">
            {schedule.map((item: any) => {
              const event = item.event_teams?.events;
              if (!event) return null;
              const hoursUntil = differenceInHours(new Date(event.start_date), new Date());
              const isUrgent = hoursUntil <= 48 && hoursUntil > 0;
              const sc = statusConfig[item.status] || statusConfig.pendente;

              return (
                <Card key={item.id} className={cn(isUrgent && "border-primary")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {event.event_types?.color && (
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.event_types.color }} />
                          )}
                          <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                          {isUrgent && <Badge variant="destructive" className="text-xs shrink-0">Em breve</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.start_date), "dd/MM · HH:mm", { locale: ptBR })}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="text-muted-foreground">Equipe:</span>
                          <span className="text-foreground">{item.event_teams?.name}</span>
                          {item.role_name && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-foreground">{item.role_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        {item.status === "pendente" && (
                          <Button size="sm" onClick={() => handleConfirm(item.id)}>
                            <Check className="h-3 w-3 mr-1" /> Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MySchedulePage;
