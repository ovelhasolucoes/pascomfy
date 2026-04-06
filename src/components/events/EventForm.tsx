import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/useEvents";
import { useEventTypes } from "@/hooks/useEventTypes";
import { toast } from "sonner";

export function EventForm() {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const { eventTypes } = useEventTypes();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTypeId, setEventTypeId] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState("08:00");
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) {
      toast.error("Título e data de início são obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      const [sh, sm] = startTime.split(":").map(Number);
      const start = new Date(startDate);
      start.setHours(sh, sm);

      let end: string | undefined;
      if (endDate) {
        const [eh, em] = endTime.split(":").map(Number);
        const endD = new Date(endDate);
        endD.setHours(eh, em);
        end = endD.toISOString();
      }

      const result = await createEvent.mutateAsync({
        title,
        description: description || null,
        event_type_id: eventTypeId || null,
        start_date: start.toISOString(),
        end_date: end || null,
        location: location || null,
      });

      toast.success("Evento criado com sucesso!");
      navigate(`/events/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar evento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl animate-fade-in">
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do evento" />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Evento</Label>
            <Select value={eventTypeId} onValueChange={setEventTypeId}>
              <SelectTrigger className="h-11">
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
                  <Button variant="outline" className={cn("w-full justify-start h-11", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11" />
            </div>

            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start h-11", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Onde será o evento" className="h-11" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} size="lg" className="shadow-sm">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Criando...
            </>
          ) : (
            "Criar Evento"
          )}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => navigate("/events")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
