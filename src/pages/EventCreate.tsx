import { AppLayout } from "@/components/layout/AppLayout";
import { EventForm } from "@/components/events/EventForm";
import { PageHeader } from "@/components/ui/page-header";

const EventCreate = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Novo Evento" description="Crie um novo evento para sua paróquia" />
        <EventForm />
      </div>
    </AppLayout>
  );
};

export default EventCreate;
