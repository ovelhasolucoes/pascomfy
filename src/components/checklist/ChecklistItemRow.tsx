import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/hooks/useEventChecklist";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: (itemId: string, progressId?: string, currentStatus?: string) => void;
  disabled?: boolean;
}

export const ChecklistItemRow = ({ item, onToggle, disabled }: ChecklistItemRowProps) => {
  const [showDesc, setShowDesc] = useState(false);
  const isCompleted = item.progress?.status === "concluido";
  const completedByOther = isCompleted && item.scope === "shared" && item.progress?.user_name;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
        isCompleted
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() =>
          onToggle(item.id, item.progress?.id, item.progress?.status)
        }
        disabled={disabled || (isCompleted && item.scope === "shared" && !!item.progress?.user_name)}
        className={cn(
          "mt-0.5 h-6 w-6 rounded-md transition-transform duration-200",
          isCompleted && "scale-110"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium cursor-pointer",
              isCompleted && "line-through text-muted-foreground"
            )}
            onClick={() => item.description && setShowDesc(!showDesc)}
          >
            {item.title}
          </span>
          {item.is_required && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Obrigatório
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.scope === "individual" ? "Individual" : "Equipe"}
          </Badge>
        </div>
        {showDesc && item.description && (
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
        )}
        {completedByOther && (
          <p className="text-xs text-muted-foreground mt-1">
            Concluído por {item.progress!.user_name}
          </p>
        )}
      </div>
    </div>
  );
};
