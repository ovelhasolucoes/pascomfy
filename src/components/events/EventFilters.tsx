import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

interface EventFiltersProps {
  eventTypes: Tables<"event_types">[];
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
}

export function EventFilters({ eventTypes, selectedType, onTypeChange, selectedStatus, onStatusChange }: EventFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Tipo de evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {eventTypes.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                {t.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />}
                {t.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="ativo">Ativos</SelectItem>
          <SelectItem value="cancelado">Cancelados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
