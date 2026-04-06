import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistSection } from "@/components/checklist/ChecklistSection";
import { AttendanceButton } from "@/components/attendance/AttendanceButton";
import { useRealtimeChecklist } from "@/hooks/useRealtimeChecklist";

interface LiveModeViewProps {
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  onExit: () => void;
}

export const LiveModeView = ({ eventId, eventTitle, eventStartDate, onExit }: LiveModeViewProps) => {
  useRealtimeChecklist(eventId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onExit}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{eventTitle}</h1>
          <p className="text-xs text-muted-foreground">Modo Foco</p>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-lg mx-auto w-full">
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Presença</h2>
          <AttendanceButton eventId={eventId} eventStartDate={eventStartDate} />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Checklist</h2>
          <ChecklistSection eventId={eventId} />
        </section>
      </main>
    </div>
  );
};
