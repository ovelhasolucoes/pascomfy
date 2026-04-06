import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableBiolinkItem } from "./SortableBiolinkItem";
import type { BiolinkItem } from "@/hooks/useBiolink";

interface Props {
  items: BiolinkItem[];
  clickCounts: Record<string, number>;
  onToggle: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (item: BiolinkItem) => void;
  onReorder: (items: { id: string; ordem: number }[]) => void;
}

export function BiolinkItemList({ items, clickCounts, onToggle, onDelete, onEdit, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    onReorder(newItems.map((item, i) => ({ id: item.id, ordem: i })));
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Nenhum link adicionado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Clique em "Adicionar" para começar.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableBiolinkItem
              key={item.id}
              item={item}
              clickCount={clickCounts[item.id] || 0}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
