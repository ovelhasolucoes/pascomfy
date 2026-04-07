import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogBody } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { useEvents, type EventWithType } from "@/hooks/useEvents";
import { useEventTypes } from "@/hooks/useEventTypes";
import { toast } from "sonner";

interface EditEventDialogProps {
  open: boolean;
  onClose: () => void;
  event: EventWithType;
}

export function EditEventDialog({ open, onClose, event }: EditEventDialogProps) {
  const { updateEvent } = useEvents();
  const { eventTypes } = useEventTypes();

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || "");
  const [eventTypeId, setEventTypeId] = useState(event.event_type_id || "");
  const [startDate, setStartDate] = useState<Date>(new Date(event.start_date));
  const [startTime, setStartTime] = useState(format(new Date(event.start_date), "HH:mm"));
  const [endDate, setEndDate] = useState<Date | undefined>(event.end_date ? new Date(event.end_date) : undefined);
  const [endTime, setEndTime] = useState(event.end_date ? format(new Date(event.end_date), "HH:mm") : "10:00");
  const [location, setLocation] = useState(event.location || "");
  const [status, setStatus] = useState(event.status);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(event.title);
      setDescription(event.description || "");
      setEventTypeId(event.event_type_id || "");
      setStartDate(new Date(event.start_date));
      setStartTime(format(new Date(event.start_date), "HH:mm"));
      setEndDate(event.end_date ? new Date(event.end_date) : undefined);
      setEndTime(event.end_date ? format(new Date(event.end_date), "HH:mm") : "10:00");
      setLocation(event.location || "");
      setStatus(event.status);
    }
  }, [open, event]);

  const handleSubmit = async () => {
    if (!title || !startDate) {
      toast.error("Título e data de início são obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const start = new Date(startDate);
      start.setHours(sh, sm);

      let end: string | null = null;
      if (endDate) {
        const [eh, em] = endTime.split(":").map(Number);
        const endD = new Date(endDate);
        endD.setHours(eh, em);
        end = endD.toISOString();
      }

      await updateEvent.mutateAsync({
        id: event.id,
        title,
        description: description || null,
        event_type_id: eventTypeId || null,
        start_date: start.toISOString(),
        end_date: end,
        location: location || null,
        status,
      });

      toast.success("Evento atualizado!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar evento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Editar Evento</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do evento" />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={eventTypeId} onValueChange={setEventTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        {t.color && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />}
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Data de Término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Local</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Onde será o evento" />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "ativo" | "cancelado")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
