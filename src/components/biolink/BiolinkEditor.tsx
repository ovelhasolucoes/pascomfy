import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Biolink, BiolinkItem } from "@/hooks/useBiolink";
import { BiolinkPreview } from "./BiolinkPreview";
import { BiolinkItemList } from "./BiolinkItemList";
import { BiolinkItemDialog } from "./BiolinkItemDialog";

interface Props {
  biolink: Biolink;
  items: BiolinkItem[];
  clickCounts: Record<string, number>;
  publicUrl: string;
  onUpdate: (values: Partial<Biolink>) => void;
  onAddItem: (values: { titulo: string; url: string; tipo: BiolinkItem["tipo"] }) => void;
  onUpdateItem: (values: Partial<BiolinkItem> & { id: string }) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (items: { id: string; ordem: number }[]) => void;
  saving?: boolean;
}

export function BiolinkEditor({
  biolink,
  items,
  clickCounts,
  publicUrl,
  onUpdate,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorder,
  saving,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<BiolinkItem | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado!");
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onReorder(newItems.map((item, i) => ({ id: item.id, ordem: i })));
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onReorder(newItems.map((item, i) => ({ id: item.id, ordem: i })));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings */}
      <div className="lg:col-span-2 space-y-6">
        {/* Public URL */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Input value={publicUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personalização */}
        <Card>
          <CardHeader><CardTitle className="text-base">Personalização</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={biolink.slug}
                  onChange={(e) => onUpdate({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                />
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={biolink.titulo} onChange={(e) => onUpdate({ titulo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={biolink.descricao || ""}
                onChange={(e) => onUpdate({ descricao: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Logo</Label>
              <Input
                value={biolink.logo_url || ""}
                onChange={(e) => onUpdate({ logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={biolink.cor_primaria}
                    onChange={(e) => onUpdate({ cor_primaria: e.target.value })}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input value={biolink.cor_primaria} onChange={(e) => onUpdate({ cor_primaria: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor Secundária</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={biolink.cor_secundaria}
                    onChange={(e) => onUpdate({ cor_secundaria: e.target.value })}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input value={biolink.cor_secundaria} onChange={(e) => onUpdate({ cor_secundaria: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Biolink Ativo</Label>
              <Switch checked={biolink.ativo} onCheckedChange={(ativo) => onUpdate({ ativo })} />
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Links</CardTitle>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            <BiolinkItemList
              items={items}
              clickCounts={clickCounts}
              onToggle={(id, ativo) => onUpdateItem({ id, ativo })}
              onDelete={onDeleteItem}
              onEdit={setEditItem}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </CardContent>
        </Card>

        <BiolinkItemDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmit={(values) => {
            onAddItem(values);
            setAddOpen(false);
          }}
        />

        {editItem && (
          <BiolinkItemDialog
            open={!!editItem}
            onOpenChange={() => setEditItem(null)}
            initialValues={editItem}
            onSubmit={(values) => {
              onUpdateItem({ id: editItem.id, ...values });
              setEditItem(null);
            }}
          />
        )}
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
        <BiolinkPreview biolink={biolink} items={items} />
      </div>
    </div>
  );
}
