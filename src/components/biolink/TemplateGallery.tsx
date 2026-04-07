import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBiolinkTemplates, type BiolinkTemplate, type BiolinkTemplateItem } from "@/hooks/useBiolinkTemplates";
import { TipoIcon } from "./BiolinkTypeIcons";
import { FileText, Church, Share2, Video, Heart, Sparkles, Eye, Check, Link2 } from "lucide-react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription } from "@/components/ui/responsive-dialog";
import type { BiolinkItem } from "@/hooks/useBiolink";

const CATEGORIA_CONFIG: Record<string, { label: string; icon: typeof Church; gradient: string }> = {
  igreja: { label: "Igreja", icon: Church, gradient: "from-blue-500 to-indigo-600" },
  social: { label: "Social", icon: Share2, gradient: "from-purple-500 to-pink-500" },
  transmissao: { label: "Transmissão", icon: Video, gradient: "from-red-500 to-orange-500" },
  doacao: { label: "Doação", icon: Heart, gradient: "from-rose-500 to-pink-600" },
  geral: { label: "Geral", icon: Sparkles, gradient: "from-amber-400 to-orange-500" },
};

interface Props {
  onSelect: (template: BiolinkTemplate, items: BiolinkTemplateItem[]) => void;
  onSkip: () => void;
}

function MiniPhonePreview({ items, gradient }: { items: BiolinkTemplateItem[]; gradient: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[180px]">
      {/* Phone frame */}
      <div className="rounded-[20px] overflow-hidden shadow-lg border-[3px] border-foreground/10">
        <div className={`bg-gradient-to-br ${gradient} p-3 min-h-[220px]`}>
          {/* Notch */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-black/20 mb-3" />
          {/* Avatar placeholder */}
          <div className="flex flex-col items-center gap-1.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
              <Link2 className="h-3.5 w-3.5 text-white/80" />
            </div>
            <div className="w-16 h-1.5 rounded bg-white/30" />
          </div>
          {/* Items */}
          <div className="space-y-1.5">
            {items.slice(0, 5).map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/90"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontSize: "8px",
                }}
              >
                <div className="w-3 h-3 rounded bg-white/20 flex-shrink-0" />
                <span className="truncate font-medium">{item.titulo}</span>
              </div>
            ))}
            {items.length > 5 && (
              <div className="text-center">
                <span className="text-white/40" style={{ fontSize: "7px" }}>
                  +{items.length - 5} mais
                </span>
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="mt-3 text-center">
            <span className="text-white/20 font-bold tracking-widest" style={{ fontSize: "6px" }}>
              PASCOMFY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FullPhonePreview({ items, gradient, templateName }: { items: BiolinkTemplateItem[]; gradient: string; templateName: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="rounded-[28px] overflow-hidden shadow-2xl border-[4px] border-foreground/10">
        <div className={`bg-gradient-to-br ${gradient} p-5 min-h-[440px]`}>
          {/* Notch */}
          <div className="mx-auto w-20 h-2 rounded-full bg-black/20 mb-5" />
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2.5 mb-5">
            <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center shadow-lg">
              <Link2 className="h-7 w-7 text-white/80" />
            </div>
            <h4 className="text-white font-bold text-base drop-shadow-sm">Sua Paróquia</h4>
            <p className="text-white/60 text-[10px]">Descrição do seu biolink</p>
          </div>
          {/* Items */}
          <div className="space-y-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white/20 flex-shrink-0">
                  <TipoIcon tipo={item.tipo as BiolinkItem["tipo"]} size={13} />
                </div>
                <span className="truncate">{item.titulo}</span>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="mt-6 text-center">
            <span className="text-white/25 text-[9px] font-bold tracking-[0.2em]">PASCOMFY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplateGallery({ onSelect, onSkip }: Props) {
  const { templates, getTemplateItems, isLoading } = useBiolinkTemplates();
  const [previewTemplate, setPreviewTemplate] = useState<BiolinkTemplate | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  const previewItems = previewTemplate ? getTemplateItems(previewTemplate.id) : [];
  const previewGradient = previewTemplate
    ? (CATEGORIA_CONFIG[previewTemplate.categoria] || CATEGORIA_CONFIG.geral).gradient
    : "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
          <Link2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Escolha um template</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Comece com um modelo pronto e personalize como quiser, ou crie do zero
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {templates.map((template) => {
          const templateItems = getTemplateItems(template.id);
          const catConfig = CATEGORIA_CONFIG[template.categoria] || CATEGORIA_CONFIG.geral;
          const CatIcon = catConfig.icon;

          return (
            <div
              key={template.id}
              className="group relative flex flex-col rounded-2xl border-2 border-border/50 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setPreviewTemplate(template)}
            >
              {/* Phone preview area */}
              <div className="relative pt-4 pb-2 px-3 bg-muted/30">
                <MiniPhonePreview items={templateItems} gradient={catConfig.gradient} />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-t-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="h-8 text-xs shadow-lg">
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 flex-1 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <CatIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <h3 className="font-semibold text-sm truncate">{template.nome}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {template.descricao}
                </p>
                <Badge variant="outline" className="text-[9px] w-fit mt-auto">
                  {templateItems.length} links
                </Badge>
              </div>
            </div>
          );
        })}

        {/* Em branco */}
        <div
          className="group relative flex flex-col rounded-2xl border-2 border-dashed border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={onSkip}
        >
          <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] gap-3 p-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">Em branco</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Comece do zero</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <ResponsiveDialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              {previewTemplate && (
                <>
                  {(() => {
                    const CatIcon = (CATEGORIA_CONFIG[previewTemplate.categoria] || CATEGORIA_CONFIG.geral).icon;
                    return <CatIcon className="h-5 w-5 text-primary" />;
                  })()}
                  {previewTemplate.nome}
                </>
              )}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {previewTemplate?.descricao}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {previewTemplate && (
            <div className="space-y-5 px-1">
              <FullPhonePreview
                items={previewItems}
                gradient={previewGradient}
                templateName={previewTemplate.nome}
              />

              {/* Items list */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground px-1">
                  Links incluídos ({previewItems.length})
                </p>
                <div className="space-y-1">
                  {previewItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50">
                      <TipoIcon tipo={item.tipo as BiolinkItem["tipo"]} size={14} />
                      <span className="text-xs font-medium truncate">{item.titulo}</span>
                      <Check className="h-3 w-3 text-green-500 ml-auto flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pb-2">
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
                  <Check className="h-4 w-4 mr-1" />
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
