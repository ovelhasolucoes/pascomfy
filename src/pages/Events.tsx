import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventCalendar } from "@/components/events/EventCalendar";
import { EventFilters } from "@/components/events/EventFilters";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton-card";
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
      <div className="space-y-6">
        <PageHeader title="Eventos" description="Calendário de eventos da sua paróquia" />

        <EventFilters
          eventTypes={eventTypes}
          selectedType={typeFilter}
          onTypeChange={setTypeFilter}
          selectedStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard lines={6} />
          </div>
        ) : (
          <EventCalendar events={events} canCreate={hasPermission("criar_evento")} />
        )}
      </div>
    </AppLayout>
  );
};

export default Events;
