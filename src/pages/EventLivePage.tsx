import { useParams, useNavigate } from "react-router-dom";
import { LiveModeView } from "@/components/live/LiveModeView";
import { useEvents } from "@/hooks/useEvents";

const EventLivePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const event = events.find((e) => e.id === id);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Evento não encontrado</p></div>;
  }

  return (
    <LiveModeView
      eventId={id!}
      eventTitle={event.title}
      eventStartDate={event.start_date}
      onExit={() => navigate(`/events/${id}`)}
    />
  );
};

export default EventLivePage;
