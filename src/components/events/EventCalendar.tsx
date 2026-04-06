import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EventWithType } from "@/hooks/useEvents";

interface EventCalendarProps {
  events: EventWithType[];
  canCreate: boolean;
}

export function EventCalendar({ events, canCreate }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPadding = getDay(monthStart);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventWithType[]>();
    events.forEach((event) => {
      const key = format(new Date(event.start_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground capitalize min-w-[160px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/events/new")}>
            <Plus className="h-4 w-4 mr-1" /> Novo Evento
          </Button>
        )}
      </div>

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {weekDays.map((d) => (
            <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50 border-b border-border">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-border bg-muted/20" />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) || [];
            const isToday = isSameDay(day, new Date());
            return (
              <div key={key} className={cn("min-h-[100px] border-b border-r border-border p-1", isToday && "bg-accent/30")}>
                <span className={cn("text-sm", isToday ? "font-bold text-primary" : "text-foreground")}>{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="w-full text-left text-xs px-1 py-0.5 rounded truncate transition-colors hover:opacity-80"
                      style={{ backgroundColor: ev.event_types?.color || "hsl(var(--primary))", color: "#fff" }}
                    >
                      {format(new Date(ev.start_date), "HH:mm")} {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-muted-foreground pl-1">+{dayEvents.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Event List */}
      <div className="md:hidden space-y-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum evento neste mês</p>
        ) : (
          events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}`)}
              className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {ev.event_types?.color && (
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ev.event_types.color }} />
                )}
                <span className="font-medium text-foreground truncate">{ev.title}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(ev.start_date), "dd/MM · HH:mm", { locale: ptBR })}
                {ev.location && ` · ${ev.location}`}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
