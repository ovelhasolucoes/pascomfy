import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";
import { useBiolink } from "@/hooks/useBiolink";
import { BiolinkEditor } from "@/components/biolink/BiolinkEditor";
import { TemplateGallery } from "@/components/biolink/TemplateGallery";
import type { BiolinkTemplate, BiolinkTemplateItem } from "@/hooks/useBiolinkTemplates";

export default function AdminBiolink() {
  const {
    biolink,
    items,
    clickCounts,
    isLoading,
    publicUrl,
    createBiolink,
    updateBiolink,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  } = useBiolink();

  const [newSlug, setNewSlug] = useState("");
  const [newTitulo, setNewTitulo] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<{ template: BiolinkTemplate; items: BiolinkTemplateItem[] } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleUpdate = (values: any) => {
    updateBiolink.mutate(values);
  };

  const handleSelectTemplate = (template: BiolinkTemplate, templateItems: BiolinkTemplateItem[]) => {
    setSelectedTemplate({ template, items: templateItems });
    setShowForm(true);
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    setShowForm(true);
  };

  const handleCreateWithTemplate = async () => {
    createBiolink.mutate(
      { slug: newSlug, titulo: newTitulo },
      {
        onSuccess: async (data) => {
          if (selectedTemplate && data) {
            // Copy template items to the new biolink
            for (const tItem of selectedTemplate.items) {
              await addItem.mutateAsync({
                titulo: tItem.titulo,
                url: tItem.url_placeholder,
                tipo: tItem.tipo as any,
                icone: tItem.icone || undefined,
              });
            }
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!biolink) {
    // Step 1: Template gallery, Step 2: Slug/name form
    if (!showForm) {
      return (
        <AppLayout>
          <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <TemplateGallery onSelect={handleSelectTemplate} onSkip={handleSkipTemplate} />
          </div>
        </AppLayout>
      );
    }

    return (
      <AppLayout>
        <div className="max-w-lg mx-auto py-12 px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>
                {selectedTemplate ? `Criar com "${selectedTemplate.template.nome}"` : "Criar Biolink"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate
                  ? `${selectedTemplate.items.length} links serão adicionados automaticamente`
                  : "Crie uma página pública de links para sua paróquia"}
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateWithTemplate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="paroquia-sao-jose"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Será acessível em: ...biolink-page?slug={newSlug || "seu-slug"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newTitulo}
                    onChange={(e) => setNewTitulo(e.target.value)}
                    placeholder="Paróquia São José"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedTemplate(null);
                    }}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createBiolink.isPending}>
                    {createBiolink.isPending ? "Criando..." : "Criar Biolink"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Biolink</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua página pública de links</p>
        </div>
        <BiolinkEditor
          biolink={biolink}
          items={items}
          clickCounts={clickCounts}
          publicUrl={publicUrl!}
          onUpdate={handleUpdate}
          onAddItem={(v) => addItem.mutate(v)}
          onUpdateItem={(v) => updateItem.mutate(v)}
          onDeleteItem={(id) => deleteItem.mutate(id)}
          onReorder={(items) => reorderItems.mutate(items)}
          saving={updateBiolink.isPending}
        />
      </div>
    </AppLayout>
  );
}
