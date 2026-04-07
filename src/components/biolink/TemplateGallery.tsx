import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBiolinkTemplates, type BiolinkTemplate, type BiolinkTemplateItem } from "@/hooks/useBiolinkTemplates";
import { TipoIcon } from "./BiolinkTypeIcons";
import { FileText, Church, Share2, Video, Heart, Sparkles, Eye } from "lucide-react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import type { BiolinkItem } from "@/hooks/useBiolink";

const CATEGORIA_CONFIG: Record<string, { label: string; icon: typeof Church; color: string }> = {
  igreja: { label: "Igreja", icon: Church, color: "bg-blue-100 text-blue-700" },
  social: { label: "Social", icon: Share2, color: "bg-purple-100 text-purple-700" },
  transmissao: { label: "Transmissão", icon: Video, color: "bg-red-100 text-red-700" },
  doacao: { label: "Doação", icon: Heart, color: "bg-rose-100 text-rose-700" },
  geral: { label: "Geral", icon: Sparkles, color: "bg-amber-100 text-amber-700" },
};

interface Props {
  onSelect: (template: BiolinkTemplate, items: BiolinkTemplateItem[]) => void;
  onSkip: () => void;
}

export function TemplateGallery({ onSelect, onSkip }: Props) {
  const { templates, getTemplateItems, isLoading } = useBiolinkTemplates();
  const [previewTemplate, setPreviewTemplate] = useState<BiolinkTemplate | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando templates...</p>
      </div>
    );
  }

  const previewItems = previewTemplate ? getTemplateItems(previewTemplate.id) : [];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Escolha um template</h2>
        <p className="text-sm text-muted-foreground">
          Comece com um modelo pronto ou crie do zero
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const items = getTemplateItems(template.id);
          const catConfig = CATEGORIA_CONFIG[template.categoria] || CATEGORIA_CONFIG.geral;
          const CatIcon = catConfig.icon;

          return (
            <Card
              key={template.id}
              className="group hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
              onClick={() => setPreviewTemplate(template)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${catConfig.color}`}>
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{template.nome}</h3>
                      <Badge variant="outline" className="text-[10px] mt-0.5">
                        {catConfig.label}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {template.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.descricao}</p>
                )}

                <div className="space-y-1.5">
                  {items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <TipoIcon tipo={item.tipo as BiolinkItem["tipo"]} size={12} />
                      <span className="truncate">{item.titulo}</span>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <p className="text-[10px] text-muted-foreground pl-7">
                      +{items.length - 4} mais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Card "Em branco" */}
        <Card
          className="group hover:shadow-md transition-all cursor-pointer border-2 border-dashed hover:border-primary/50"
          onClick={onSkip}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[160px] gap-3">
            <div className="p-3 rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">Em branco</h3>
              <p className="text-xs text-muted-foreground">Comece do zero</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <ResponsiveDialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{previewTemplate?.nome}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>

          {previewTemplate && (
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">{previewTemplate.descricao}</p>

              {/* Mini preview */}
              <div
                className="rounded-2xl overflow-hidden shadow-lg mx-auto"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  maxWidth: 280,
                  minHeight: 300,
                }}
              >
                <div className="flex flex-col items-center gap-2.5 p-5">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xl text-white font-bold">P</span>
                  </div>
                  <h3 className="text-white font-bold text-sm">Sua Paróquia</h3>

                  <div className="w-full space-y-2 mt-2">
                    {previewItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white text-xs font-medium"
                        style={{
                          background: "rgba(255,255,255,0.18)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        <TipoIcon tipo={item.tipo as BiolinkItem["tipo"]} size={12} />
                        <span className="truncate">{item.titulo}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-white/30 text-[9px] mt-4 font-medium tracking-wider">PASCOMFY</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    onSelect(previewTemplate, previewItems);
                    setPreviewTemplate(null);
                  }}
                >
                  Usar template
                </Button>
              </div>
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
