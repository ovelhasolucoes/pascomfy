import { useState } from "react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogFooter as DialogFooter,
} from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Check, Clock, MapPin, RefreshCw, Loader2, CalendarDays } from "lucide-react";
import { useMySchedule } from "@/hooks/useMySchedule";
import { useEventMembers } from "@/hooks/useEventMembers";
import { useSubstitutions } from "@/hooks/useSubstitutions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const MySchedulePage = () => {
  const { schedule, loading } = useMySchedule();
  const { confirmPresence } = useEventMembers();
  const { mySubstitutions, requestSubstitution } = useSubstitutions();
  const navigate = useNavigate();

  const [subDialog, setSubDialog] = useState<{ eventId: string; memberId: string } | null>(null);
  const [reason, setReason] = useState("");

  const handleConfirm = async (memberId: string) => {
    try {
      await confirmPresence.mutateAsync(memberId);
      toast.success("Presença confirmada!");
    } catch (err: any) { toast.error(err.message); }
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
    } catch (err: any) { toast.error(err.message); }
  };

  const getSubStatus = (memberId: string) => mySubstitutions.find((s) => s.event_team_member_id === memberId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Minha Agenda" />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} hasHeader={false} lines={2} />)}
          </div>
        ) : schedule.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum evento na agenda"
            description="Você será notificado quando for escalado."
          />
        ) : (
          <div className="space-y-3">
            {schedule.map((item: any) => {
              const event = item.event_teams?.events;
              if (!event) return null;
              const hoursUntil = differenceInHours(new Date(event.start_date), new Date());
              const existingSub = getSubStatus(item.id);
              const isPending = item.status === "pendente";
              const canRequestSub = !existingSub && item.status !== "substituido" && hoursUntil > 0;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "cursor-pointer active:scale-[0.99] transition-transform",
                    hoursUntil <= 48 && hoursUntil > 0 && "border-primary/40"
                  )}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {event.event_types?.color && (
                          <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.event_types.color }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground line-clamp-1">{event.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
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
                      </div>

                      {/* Action buttons */}
                      {(isPending || canRequestSub) && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {isPending && (
                            <Button size="sm" className="flex-1" onClick={() => handleConfirm(item.id)}>
                              <Check className="h-3.5 w-3.5 mr-1" /> Confirmar presença
                            </Button>
                          )}
                          {canRequestSub && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => setSubDialog({ eventId: event.id, memberId: item.id })}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Não posso ir
                            </Button>
                          )}
                        </div>
                      )}
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
            <DialogTitle>Não posso ir</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Conte o motivo. O admin será avisado.</p>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubDialog(null); setReason(""); }}>Cancelar</Button>
            <Button onClick={handleRequestSub} disabled={!reason.trim() || requestSubstitution.isPending}>
              {requestSubstitution.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MySchedulePage;
