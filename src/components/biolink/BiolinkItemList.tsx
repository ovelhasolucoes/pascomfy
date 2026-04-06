import { ArrowUp, ArrowDown, Trash2, Eye, EyeOff, MousePointerClick, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { BiolinkItem } from "@/hooks/useBiolink";

const TIPO_LABELS: Record<string, string> = {
  link: "Link",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  doacao: "Doação",
};

interface Props {
  items: BiolinkItem[];
  clickCounts: Record<string, number>;
  onToggle: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (item: BiolinkItem) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function BiolinkItemList({ items, clickCounts, onToggle, onDelete, onEdit, onMoveUp, onMoveDown }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhum link adicionado ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <div className="flex flex-col gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => onMoveUp(index)}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === items.length - 1} onClick={() => onMoveDown(index)}>
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{item.titulo}</span>
              <Badge variant="outline" className="text-xs shrink-0">{TIPO_LABELS[item.tipo]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <MousePointerClick className="h-3 w-3" />
            <span>{clickCounts[item.id] || 0}</span>
          </div>

          <Switch
            checked={item.ativo}
            onCheckedChange={(checked) => onToggle(item.id, checked)}
          />

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
