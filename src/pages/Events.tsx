import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventCalendar } from "@/components/events/EventCalendar";
import { EventFilters } from "@/components/events/EventFilters";
import { useEvents } from "@/hooks/useEvents";
import { useEventTypes } from "@/hooks/useEventTypes";
import { usePermissions } from "@/hooks/usePermissions";

const Events = () => {
  const [currentDate] = useState(new Date());
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { hasPermission } = usePermissions();
  const { eventTypes } = useEventTypes();

  const { events, loading } = useEvents({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    typeId: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">Calendário de eventos da sua paróquia</p>
        </div>

        <EventFilters
          eventTypes={eventTypes}
          selectedType={typeFilter}
          onTypeChange={setTypeFilter}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Carregando eventos...</p>
        ) : (
          <EventCalendar events={events} canCreate={hasPermission("criar_evento")} />
        )}
      </div>
    </AppLayout>
  );
};

export default Events;
