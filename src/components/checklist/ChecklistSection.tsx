import { useEventChecklist } from "@/hooks/useEventChecklist";
import { useChecklistProgress } from "@/hooks/useChecklistProgress";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { ChecklistProgressBar } from "./ChecklistProgressBar";
import { toast } from "sonner";

interface ChecklistSectionProps {
  eventId: string;
}

export const ChecklistSection = ({ eventId }: ChecklistSectionProps) => {
  const { checklists, loading } = useEventChecklist(eventId);
  const { toggleItem } = useChecklistProgress(eventId);

  const handleToggle = async (itemId: string, progressId?: string, currentStatus?: string) => {
    try {
      await toggleItem.mutateAsync({ itemId, currentProgressId: progressId, currentStatus });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-4">Carregando checklist...</p>;
  }

  if (checklists.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhum checklist configurado.</p>;
  }

  return (
    <div className="space-y-6">
      {checklists.map((cl) => (
        <div key={cl.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{cl.name}</h3>
          </div>
          <ChecklistProgressBar
            completed={cl.completedCount}
            total={cl.totalCount}
            percentage={cl.percentage}
          />
          <div className="space-y-2">
            {cl.items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                disabled={toggleItem.isPending}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
