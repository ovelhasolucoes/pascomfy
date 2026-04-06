import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
    <TooltipProvider>
      <div className="space-y-4 animate-fade-in">
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
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-primary">
              Hoje
            </Button>
          </div>
          {canCreate && (
            <Button onClick={() => navigate("/events/new")} className="shadow-sm">
              <Plus className="h-4 w-4 mr-1" /> Novo Evento
            </Button>
          )}
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden md:block border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div key={d} className="p-2.5 text-center text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[110px] border-b border-r border-border bg-muted/10" />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(key) || [];
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[110px] border-b border-r border-border p-1.5 transition-colors hover:bg-muted/30",
                    isToday && "bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "text-sm inline-flex items-center justify-center w-7 h-7 rounded-full",
                    isToday ? "font-bold bg-primary text-primary-foreground" : "text-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <Tooltip key={ev.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => navigate(`/events/${ev.id}`)}
                            className="w-full text-left text-xs px-1.5 py-0.5 rounded-md truncate transition-all hover:shadow-sm hover:opacity-90"
                            style={{ backgroundColor: ev.event_types?.color || "hsl(var(--primary))", color: "#fff" }}
                          >
                            {format(new Date(ev.start_date), "HH:mm")} {ev.title}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-semibold">{ev.title}</p>
                          <p>{format(new Date(ev.start_date), "dd/MM · HH:mm", { locale: ptBR })}</p>
                          {ev.location && <p className="text-muted-foreground">{ev.location}</p>}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-primary font-medium pl-1 cursor-pointer hover:underline">
                        +{dayEvents.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Event List */}
        <div className="md:hidden">
          {events.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhum evento neste mês" description="Crie um novo evento para começar." />
          ) : (
            <div className="space-y-2 stagger-fade">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="w-full text-left p-4 rounded-xl border border-border hover:bg-muted/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2">
                    {ev.event_types?.color && (
                      <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: ev.event_types.color }} />
                    )}
                    <span className="font-semibold text-foreground truncate">{ev.title}</span>
                    {ev.event_types?.name && (
                      <Badge variant="secondary" className="text-xs ml-auto shrink-0">{ev.event_types.name}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(ev.start_date), "dd/MM · HH:mm", { locale: ptBR })}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
