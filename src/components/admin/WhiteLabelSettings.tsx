import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, Save, Loader2, Sun, Moon, Image } from "lucide-react";

export function WhiteLabelSettings() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const [theme, setTheme] = useState<string>("light");
  const [faviconUrl, setFaviconUrl] = useState("");

  useEffect(() => {
    if (company) {
      setTheme(company.theme || "light");
      setFaviconUrl(company.favicon_url || "");
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({
          theme,
          favicon_url: faviconUrl || null,
        })
        .eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["company-theme"] });
      toast.success("Identidade visual salva!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Tema do Sistema
          </CardTitle>
          <CardDescription>Escolha o modo visual para sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium">
                  Modo {theme === "dark" ? "Escuro" : "Claro"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark"
                    ? "Interface com fundo escuro"
                    : "Interface com fundo claro"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                theme === "light"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="h-16 rounded bg-white border shadow-sm mb-2" />
              <span className="text-xs font-medium">Claro</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                theme === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="h-16 rounded bg-zinc-900 border border-zinc-700 mb-2" />
              <span className="text-xs font-medium">Escuro</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>Ícone que aparece na aba do navegador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL do Favicon</Label>
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://exemplo.com/favicon.ico"
            />
          </div>
          {faviconUrl && (
            <div className="flex items-center gap-3">
              <img
                src={faviconUrl}
                alt="Favicon"
                className="h-8 w-8 rounded object-contain border bg-background"
              />
              <span className="text-sm text-muted-foreground">Preview do favicon</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Visualize como ficará sua marca</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`rounded-lg p-4 border ${
              theme === "dark" ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-zinc-900 border-border"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: company?.primary_color || "#6366f1" }}
                >
                  {company?.name?.charAt(0) || "P"}
                </div>
              )}
              <span className="font-semibold">{company?.name || "Empresa"}</span>
              {faviconUrl && (
                <img src={faviconUrl} alt="" className="h-4 w-4 ml-auto" />
              )}
            </div>
            <div className="flex gap-2">
              <div className="h-6 flex-1 rounded" style={{ backgroundColor: company?.primary_color || "#6366f1" }} />
              <div className="h-6 flex-1 rounded" style={{ backgroundColor: company?.secondary_color || "#8b5cf6" }} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvar Identidade Visual
      </Button>
    </div>
  );
}
