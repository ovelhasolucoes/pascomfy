import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, MousePointerClick, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TipoIcon, getTipoConfig } from "./BiolinkTypeIcons";
import type { BiolinkItem } from "@/hooks/useBiolink";

interface Props {
  item: BiolinkItem;
  clickCount: number;
  onToggle: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (item: BiolinkItem) => void;
}

export function SortableBiolinkItem({ item, clickCount, onToggle, onDelete, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = getTipoConfig(item.tipo);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <TipoIcon tipo={item.tipo} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.titulo}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{item.url}</p>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0" title="Cliques">
        <MousePointerClick className="h-3 w-3" />
        <span>{clickCount}</span>
      </div>

      <Switch
        checked={item.ativo}
        onCheckedChange={(checked) => onToggle(item.id, checked)}
      />

      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
