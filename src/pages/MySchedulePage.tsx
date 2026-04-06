import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clock, MapPin, RefreshCw, Loader2 } from "lucide-react";
import { useMySchedule } from "@/hooks/useMySchedule";
import { useEventMembers } from "@/hooks/useEventMembers";
import { useSubstitutions } from "@/hooks/useSubstitutions";
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
  const { mySubstitutions, requestSubstitution } = useSubstitutions();

  const [subDialog, setSubDialog] = useState<{ eventId: string; memberId: string } | null>(null);
  const [reason, setReason] = useState("");

  const handleConfirm = async (memberId: string) => {
    try {
      await confirmPresence.mutateAsync(memberId);
      toast.success("Presença confirmada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRequestSub = async () => {
    if (!subDialog || !reason.trim()) return;
    try {
      await requestSubstitution.mutateAsync({
        eventId: subDialog.eventId,
        eventTeamMemberId: subDialog.memberId,
        reason: reason.trim(),
      });
      toast.success("Substituição solicitada!");
      setSubDialog(null);
      setReason("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getSubStatus = (memberId: string) => {
    return mySubstitutions.find((s) => s.event_team_member_id === memberId);
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
              const existingSub = getSubStatus(item.id);

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
                        {existingSub && (
                          <div className="mt-2">
                            <Badge variant={
                              existingSub.status === "aprovado" ? "default" :
                              existingSub.status === "rejeitado" ? "destructive" : "outline"
                            } className="text-xs">
                              Substituição: {existingSub.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        {item.status === "pendente" && (
                          <Button size="sm" onClick={() => handleConfirm(item.id)}>
                            <Check className="h-3 w-3 mr-1" /> Confirmar
                          </Button>
                        )}
                        {!existingSub && item.status !== "substituido" && hoursUntil > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSubDialog({ eventId: event.id, memberId: item.id })}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Substituir
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

      <Dialog open={!!subDialog} onOpenChange={() => { setSubDialog(null); setReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Substituição</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o motivo da substituição. O admin será notificado.</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubDialog(null); setReason(""); }}>Cancelar</Button>
            <Button onClick={handleRequestSub} disabled={!reason.trim() || requestSubstitution.isPending}>
              {requestSubstitution.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Solicitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MySchedulePage;
