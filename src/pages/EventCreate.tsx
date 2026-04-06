import { AppLayout } from "@/components/layout/AppLayout";
import { EventForm } from "@/components/events/EventForm";

const EventCreate = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Evento</h1>
          <p className="text-muted-foreground">Crie um novo evento para sua paróquia</p>
        </div>
        <EventForm />
      </div>
    </AppLayout>
  );
};

export default EventCreate;
