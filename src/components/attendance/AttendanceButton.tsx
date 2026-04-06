import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventAttendance } from "@/hooks/useEventAttendance";
import { toast } from "sonner";

interface AttendanceButtonProps {
  eventId: string;
  eventStartDate: string;
}

export const AttendanceButton = ({ eventId, eventStartDate }: AttendanceButtonProps) => {
  const { myAttendance, isWithinWindow, hoursUntilWindow, checkIn } = useEventAttendance(eventId, eventStartDate);

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync();
      toast.success("Presença confirmada!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (myAttendance) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <CheckCircle className="h-8 w-8 text-primary" />
        <div>
          <p className="font-semibold text-foreground">✅ Presente</p>
          {myAttendance.checkin_at && (
            <p className="text-sm text-muted-foreground">
              Check-in às {format(new Date(myAttendance.checkin_at), "HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isWithinWindow) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted border border-border">
        <Clock className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Check-in disponível em {hoursUntilWindow}h
        </p>
      </div>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full h-14 text-lg font-semibold"
      onClick={handleCheckIn}
      disabled={checkIn.isPending}
    >
      {checkIn.isPending ? "Confirmando..." : "Confirmar Presença"}
    </Button>
  );
};
