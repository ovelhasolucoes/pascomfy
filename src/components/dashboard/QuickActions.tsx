import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Download, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMySchedule } from "@/hooks/useMySchedule";
import { toast } from "sonner";
import { format } from "date-fns";

export function QuickActions() {
  const navigate = useNavigate();
  const { schedule } = useMySchedule();

  const handleExportCalendar = () => {
    if (schedule.length === 0) {
      toast.info("Nenhum evento para exportar");
      return;
    }

    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pascomfy//PT"];

    schedule.forEach((item: any) => {
      const event = item.event_teams?.events;
      if (!event) return;

      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

      lines.push("BEGIN:VEVENT");
      lines.push(`DTSTART:${fmt(start)}`);
      lines.push(`DTEND:${fmt(end)}`);
      lines.push(`SUMMARY:${event.title}`);
      if (event.location) lines.push(`LOCATION:${event.location}`);
      lines.push(`DESCRIPTION:Equipe: ${item.event_teams?.name || ""} | Função: ${item.role_name || ""}`);
      lines.push(`UID:${item.id}@pascomfy`);
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minha-escala-${format(new Date(), "yyyy-MM")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendário exportado!");
  };

  const actions = [
    {
      icon: CalendarDays,
      label: "Minha Agenda",
      onClick: () => navigate("/my-schedule"),
      variant: "default" as const,
    },
    {
      icon: Download,
      label: "Exportar .ics",
      onClick: handleExportCalendar,
      variant: "outline" as const,
    },
    {
      icon: RefreshCw,
      label: "Pedir Substituição",
      onClick: () => navigate("/admin/substitutions"),
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
