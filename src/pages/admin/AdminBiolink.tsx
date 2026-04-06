import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";
import { useBiolink } from "@/hooks/useBiolink";
import { BiolinkEditor } from "@/components/biolink/BiolinkEditor";
import { useMemo } from "react";

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

  // Debounced update
  const handleUpdate = (values: any) => {
    updateBiolink.mutate(values);
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
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto py-12 px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Criar Biolink</CardTitle>
              <p className="text-sm text-muted-foreground">
                Crie uma página pública de links para sua paróquia
              </p>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createBiolink.mutate({ slug: newSlug, titulo: newTitulo });
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
                <Button type="submit" className="w-full" disabled={createBiolink.isPending}>
                  Criar Biolink
                </Button>
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
