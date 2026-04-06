import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Palette, Save, Loader2, Sun, Moon, Upload, X, Image as ImageIcon,
  Monitor, Smartphone, Calendar, Users, Bell, Settings
} from "lucide-react";

export function WhiteLabelSettings() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [theme, setTheme] = useState<string>("light");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setLogoUrl(company.logo_url || "");
      setPrimaryColor(company.primary_color || "#6366f1");
      setSecondaryColor(company.secondary_color || "#8b5cf6");
      setTheme(company.theme || "light");
      setFaviconUrl(company.favicon_url || "");
    }
  }, [company]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${companyId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-files")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-files")
        .getPublicUrl(path);

      setLogoUrl(urlData.publicUrl + "?t=" + Date.now());
      toast.success("Logo enviado com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error("Favicon deve ter no máximo 512KB");
      return;
    }

    setUploadingFavicon(true);
    try {
      const ext = file.name.split(".").pop() || "ico";
      const path = `${companyId}/favicon.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-files")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-files")
        .getPublicUrl(path);

      setFaviconUrl(urlData.publicUrl + "?t=" + Date.now());
      toast.success("Favicon enviado com sucesso!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({
          name,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          theme,
          favicon_url: faviconUrl || null,
        })
        .eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["company-theme"] });
      toast.success("Personalização salva com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left Column: Settings */}
      <div className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Logo da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div
                className="relative group h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 transition-colors hover:border-primary/50 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                    <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="h-5 w-5 text-background" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px]">Upload</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex-1 space-y-2">
                <Label className="text-xs text-muted-foreground">Ou cole a URL:</Label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
                {logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setLogoUrl("")}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome..." />
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Cores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Cor primária</Label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-12 p-0.5 cursor-pointer rounded-lg border-2 border-border"
                    />
                  </div>
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Cor secundária</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-12 p-0.5 cursor-pointer rounded-lg border-2 border-border"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 h-3 rounded-full overflow-hidden">
              <div className="flex-1 rounded-full" style={{ backgroundColor: primaryColor }} />
              <div className="flex-1 rounded-full" style={{ backgroundColor: secondaryColor }} />
            </div>
          </CardContent>
        </Card>

        {/* Theme & Favicon */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              Tema & Favicon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Modo {isDark ? "Escuro" : "Claro"}</span>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm">Favicon</Label>
              <div className="flex items-start gap-3">
                <div
                  className="relative group h-12 w-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 transition-colors hover:border-primary/50 cursor-pointer"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  {faviconUrl ? (
                    <>
                      <img src={faviconUrl} alt="Favicon" className="h-full w-full object-contain p-1" />
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-3.5 w-3.5 text-background" />
                      </div>
                    </>
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  {uploadingFavicon && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
                <div className="flex-1 space-y-1.5">
                  <Input
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="Ou cole a URL..."
                    className="text-sm"
                  />
                  {faviconUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-destructive hover:text-destructive px-2"
                      onClick={() => setFaviconUrl("")}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Recomendado: 32×32 ou 64×64 px, máx 512KB</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full h-11">
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Personalização
        </Button>
      </div>

      {/* Right Column: Full Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preview</h3>
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`p-1.5 rounded transition-colors ${previewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`p-1.5 rounded transition-colors ${previewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className={`mx-auto transition-all duration-300 ${previewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
          <div
            className={`rounded-xl border-2 overflow-hidden shadow-lg transition-colors duration-300 ${
              isDark ? "border-zinc-700" : "border-border"
            }`}
          >
            {/* Browser bar */}
            <div className={`flex items-center gap-2 px-3 py-2 border-b ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-muted/50 border-border"}`}>
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className={`flex-1 text-center text-[10px] px-3 py-1 rounded ${isDark ? "bg-zinc-700 text-zinc-400" : "bg-background text-muted-foreground"}`}>
                {faviconUrl && <img src={faviconUrl} alt="" className="inline h-3 w-3 mr-1.5 -mt-0.5" />}
                {company?.custom_domain || "app.pascomfy.com"}
              </div>
            </div>

            {/* App Layout */}
            <div className={`flex ${isDark ? "bg-zinc-950" : "bg-background"}`} style={{ minHeight: previewMode === "mobile" ? 480 : 400 }}>
              {/* Sidebar */}
              {previewMode === "desktop" && (
                <div className={`w-48 border-r p-3 space-y-3 shrink-0 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-muted/30 border-border"}`}>
                  {/* Logo area */}
                  <div className="flex items-center gap-2 mb-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
                    ) : (
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {name.charAt(0) || "P"}
                      </div>
                    )}
                    <span className={`text-sm font-semibold truncate ${isDark ? "text-zinc-100" : "text-foreground"}`}>
                      {name || "Empresa"}
                    </span>
                  </div>

                  {/* Nav items */}
                  {[
                    { icon: Calendar, label: "Eventos", active: true },
                    { icon: Users, label: "Usuários", active: false },
                    { icon: Bell, label: "Notificações", active: false },
                    { icon: Settings, label: "Configurações", active: false },
                  ].map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                        active
                          ? isDark
                            ? "bg-zinc-800 text-white"
                            : "bg-primary/10 text-primary font-medium"
                          : isDark
                            ? "text-zinc-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                  ))}
                </div>
              )}

              {/* Main content */}
              <div className={`flex-1 p-4 space-y-3 ${isDark ? "text-zinc-100" : "text-foreground"}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Eventos</h2>
                  <div
                    className="px-3 py-1 rounded-md text-[10px] font-medium text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    + Novo
                  </div>
                </div>

                {/* Cards */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-card border-border"}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: i === 1 ? primaryColor : secondaryColor }}
                      />
                      <span className="text-xs font-medium">
                        {i === 1 ? "Missa Dominical" : i === 2 ? "Ensaio do Coral" : "Reunião Pastoral"}
                      </span>
                    </div>
                    <div className={`text-[10px] ${isDark ? "text-zinc-500" : "text-muted-foreground"}`}>
                      {i === 1 ? "Dom, 10:00" : i === 2 ? "Sáb, 15:00" : "Qua, 19:00"}
                    </div>
                  </div>
                ))}

                {/* Footer accent */}
                <div className="flex gap-2 mt-2">
                  <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                  <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          As cores e o logo serão aplicados em todo o sistema após salvar
        </p>
      </div>
    </div>
  );
}
