import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Check } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/ui/responsive-dialog";
import { useBiolinkTemplates, type BiolinkTemplateItem } from "@/hooks/useBiolinkTemplates";
import { TipoIcon } from "./BiolinkTypeIcons";
import { Badge } from "@/components/ui/badge";
import type { BiolinkItem } from "@/hooks/useBiolink";
import { Church, Share2, Video, Heart, Sparkles } from "lucide-react";

const CATEGORIA_CONFIG: Record<string, { label: string; icon: typeof Church; gradient: string }> = {
  igreja: { label: "Igreja", icon: Church, gradient: "from-blue-500 to-indigo-600" },
  social: { label: "Social", icon: Share2, gradient: "from-purple-500 to-pink-500" },
  transmissao: { label: "Transmissão", icon: Video, gradient: "from-red-500 to-orange-500" },
  doacao: { label: "Doação", icon: Heart, gradient: "from-rose-500 to-pink-600" },
  geral: { label: "Geral", icon: Sparkles, gradient: "from-amber-400 to-orange-500" },
};

interface Props {
  onApply: (items: BiolinkTemplateItem[]) => void;
  isPending?: boolean;
}

export function ApplyTemplateDialog({ onApply, isPending }: Props) {
  const [open, setOpen] = useState(false);
  const { templates, getTemplateItems, isLoading } = useBiolinkTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItems = selectedId ? getTemplateItems(selectedId) : [];
  const selectedTemplate = templates.find((t) => t.id === selectedId);

  const handleApply = () => {
    if (!selectedId) return;
    onApply(selectedItems);
    setOpen(false);
    setSelectedId(null);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LayoutTemplate className="h-4 w-4 mr-1" /> Usar template
      </Button>

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Aplicar template</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Os links do template serão adicionados ao seu biolink existente
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4 px-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {templates.map((template) => {
                  const catConfig = CATEGORIA_CONFIG[template.categoria] || CATEGORIA_CONFIG.geral;
                  const CatIcon = catConfig.icon;
                  const items = getTemplateItems(template.id);
                  const isSelected = selectedId === template.id;

                  return (
                    <div
                      key={template.id}
                      className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedId(template.id)}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <CatIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold truncate">{template.nome}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">
                        {items.length} links
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Preview dos itens selecionados */}
            {selectedTemplate && selectedItems.length > 0 && (
              <div className="space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Links que serão adicionados:
                </p>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/50">
                      <TipoIcon tipo={item.tipo as BiolinkItem["tipo"]} size={12} />
                      <span className="text-xs truncate">{item.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pb-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedId || isPending}
                onClick={handleApply}
              >
                {isPending ? "Aplicando..." : "Adicionar links"}
              </Button>
            </div>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
