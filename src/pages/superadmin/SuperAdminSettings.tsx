import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { supabase } from "@/integrations/supabase/client";
import {
  Palette, Smartphone, LogIn, CreditCard, Mail, MessageSquare,
  Megaphone, Save, Plus, Trash2, ExternalLink, Upload, Loader2
} from "lucide-react";
import { toast } from "sonner";

/* ─── Image Upload Field ─── */
function ImageUploadField({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("platform-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("platform-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt={label}
            className="h-12 w-12 rounded-lg object-contain border border-border bg-muted"
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          {value ? "Trocar" : "Enviar"}
        </Button>
        <Input
          placeholder="ou cole uma URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

/* ─── Branding & PWA ─── */
function BrandingTab({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const branding = getSetting("branding") as Record<string, string | null>;
  const pwa = getSetting("pwa") as Record<string, string | null>;

  const [form, setForm] = useState({
    app_name: branding.app_name ?? "Pascomfy",
    logo_url: branding.logo_url ?? "",
    favicon_url: branding.favicon_url ?? "",
    primary_color: branding.primary_color ?? "#c4a983",
    secondary_color: branding.secondary_color ?? "#8b7355",
    pwa_short_name: pwa.short_name ?? "Pascomfy",
    pwa_description: pwa.description ?? "",
    pwa_theme_color: pwa.theme_color ?? "#c4a983",
    pwa_bg_color: pwa.background_color ?? "#1A1816",
  });

  const handleSave = () => {
    onSave("branding", {
      app_name: form.app_name,
      logo_url: form.logo_url || null,
      favicon_url: form.favicon_url || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
    });
    onSave("pwa", {
      short_name: form.pwa_short_name,
      description: form.pwa_description,
      theme_color: form.pwa_theme_color,
      background_color: form.pwa_bg_color,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" /> Identidade Visual
          </CardTitle>
          <CardDescription>Nome, logo e cores do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do App</Label>
              <Input value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Logo"
                value={form.logo_url}
                onChange={(url) => setForm({ ...form, logo_url: url })}
                folder="branding"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Favicon"
                value={form.favicon_url}
                onChange={(url) => setForm({ ...form, favicon_url: url })}
                folder="branding"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-10 rounded border border-border cursor-pointer" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-10 rounded border border-border cursor-pointer" />
                <Input value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" /> PWA (App Instalável)
          </CardTitle>
          <CardDescription>Configurações do Progressive Web App</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome Curto</Label>
              <Input value={form.pwa_short_name} onChange={(e) => setForm({ ...form, pwa_short_name: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.pwa_description} onChange={(e) => setForm({ ...form, pwa_description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Cor do Tema</Label>
              <div className="flex gap-2">
                <input type="color" value={form.pwa_theme_color} onChange={(e) => setForm({ ...form, pwa_theme_color: e.target.value })} className="h-10 w-10 rounded border border-border cursor-pointer" />
                <Input value={form.pwa_theme_color} onChange={(e) => setForm({ ...form, pwa_theme_color: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <input type="color" value={form.pwa_bg_color} onChange={(e) => setForm({ ...form, pwa_bg_color: e.target.value })} className="h-10 w-10 rounded border border-border cursor-pointer" />
                <Input value={form.pwa_bg_color} onChange={(e) => setForm({ ...form, pwa_bg_color: e.target.value })} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" /> Salvar Branding & PWA
      </Button>
    </div>
  );
}

/* ─── Login ─── */
function LoginTab({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const login = getSetting("login") as {
    background_url?: string | null;
    welcome_title?: string;
    welcome_subtitle?: string;
    auth_methods?: { email?: boolean; google?: boolean };
  };

  const [form, setForm] = useState({
    background_url: login.background_url ?? "",
    welcome_title: login.welcome_title ?? "Bem-vindo ao Pascomfy",
    welcome_subtitle: login.welcome_subtitle ?? "",
    email: login.auth_methods?.email ?? true,
    google: login.auth_methods?.google ?? false,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LogIn className="h-5 w-5 text-primary" /> Tela de Login
          </CardTitle>
          <CardDescription>Personalize a experiência de entrada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título de Boas-vindas</Label>
            <Input value={form.welcome_title} onChange={(e) => setForm({ ...form, welcome_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input value={form.welcome_subtitle} onChange={(e) => setForm({ ...form, welcome_subtitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>URL da Imagem de Fundo</Label>
            <Input placeholder="https://..." value={form.background_url} onChange={(e) => setForm({ ...form, background_url: e.target.value })} />
          </div>
          <Separator />
          <h4 className="font-medium text-sm text-muted-foreground">Métodos de Autenticação</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Email / Senha</Label>
              <Switch checked={form.email} onCheckedChange={(v) => setForm({ ...form, email: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Google OAuth</Label>
              <Switch checked={form.google} onCheckedChange={(v) => setForm({ ...form, google: v })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => onSave("login", {
        background_url: form.background_url || null,
        welcome_title: form.welcome_title,
        welcome_subtitle: form.welcome_subtitle,
        auth_methods: { email: form.email, google: form.google },
      })} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" /> Salvar Login
      </Button>
    </div>
  );
}

/* ─── Gateways ─── */
function GatewaysTab({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const gateways = getSetting("payment_gateways") as {
    asaas?: { enabled?: boolean; mode?: string; api_key?: string | null; webhook_secret?: string | null };
    mercadopago?: { enabled?: boolean; mode?: string; access_token?: string | null; webhook_secret?: string | null };
  };

  const [form, setForm] = useState({
    asaas_enabled: gateways.asaas?.enabled ?? false,
    asaas_mode: gateways.asaas?.mode ?? "sandbox",
    asaas_key: gateways.asaas?.api_key ?? "",
    asaas_webhook: gateways.asaas?.webhook_secret ?? "",
    mp_enabled: gateways.mercadopago?.enabled ?? false,
    mp_mode: gateways.mercadopago?.mode ?? "sandbox",
    mp_token: gateways.mercadopago?.access_token ?? "",
    mp_webhook: gateways.mercadopago?.webhook_secret ?? "",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" /> Asaas
          </CardTitle>
          <CardDescription>Gateway de pagamento brasileiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={form.asaas_enabled} onCheckedChange={(v) => setForm({ ...form, asaas_enabled: v })} />
          </div>
          <div className="space-y-2">
            <Label>Modo</Label>
            <Select value={form.asaas_mode} onValueChange={(v) => setForm({ ...form, asaas_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" value={form.asaas_key} onChange={(e) => setForm({ ...form, asaas_key: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input type="password" value={form.asaas_webhook} onChange={(e) => setForm({ ...form, asaas_webhook: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" /> Mercado Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={form.mp_enabled} onCheckedChange={(v) => setForm({ ...form, mp_enabled: v })} />
          </div>
          <div className="space-y-2">
            <Label>Modo</Label>
            <Select value={form.mp_mode} onValueChange={(v) => setForm({ ...form, mp_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input type="password" value={form.mp_token} onChange={(e) => setForm({ ...form, mp_token: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input type="password" value={form.mp_webhook} onChange={(e) => setForm({ ...form, mp_webhook: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => onSave("payment_gateways", {
        asaas: { enabled: form.asaas_enabled, mode: form.asaas_mode, api_key: form.asaas_key || null, webhook_secret: form.asaas_webhook || null },
        mercadopago: { enabled: form.mp_enabled, mode: form.mp_mode, access_token: form.mp_token || null, webhook_secret: form.mp_webhook || null },
      })} className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" /> Salvar Gateways
      </Button>
    </div>
  );
}

/* ─── Notificações ─── */
function NotificationsTab({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const email = getSetting("email") as Record<string, string | number | null>;
  const wa = getSetting("whatsapp") as Record<string, string | null>;

  const [emailForm, setEmailForm] = useState({
    smtp_host: (email.smtp_host as string) ?? "",
    smtp_port: (email.smtp_port as number) ?? 587,
    smtp_user: (email.smtp_user as string) ?? "",
    smtp_from: (email.smtp_from as string) ?? "",
    smtp_from_name: (email.smtp_from_name as string) ?? "Pascomfy",
  });

  const [waForm, setWaForm] = useState({
    default_provider: (wa.default_provider as string) ?? "meta",
    meta_app_id: (wa.meta_app_id as string) ?? "",
    evo_api_url: (wa.evo_api_url as string) ?? "",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" /> Email (SMTP)
          </CardTitle>
          <CardDescription>Configuração do servidor de email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Host SMTP</Label>
              <Input placeholder="smtp.gmail.com" value={emailForm.smtp_host} onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Porta</Label>
              <Input type="number" value={emailForm.smtp_port} onChange={(e) => setEmailForm({ ...emailForm, smtp_port: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input value={emailForm.smtp_user} onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email Remetente</Label>
              <Input value={emailForm.smtp_from} onChange={(e) => setEmailForm({ ...emailForm, smtp_from: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nome Remetente</Label>
              <Input value={emailForm.smtp_from_name} onChange={(e) => setEmailForm({ ...emailForm, smtp_from_name: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" /> WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor Padrão</Label>
            <Select value={waForm.default_provider} onValueChange={(v) => setWaForm({ ...waForm, default_provider: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta (Cloud API)</SelectItem>
                <SelectItem value="evo">Evolution API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Meta App ID</Label>
            <Input value={waForm.meta_app_id} onChange={(e) => setWaForm({ ...waForm, meta_app_id: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Evolution API URL</Label>
            <Input placeholder="https://evo.exemplo.com" value={waForm.evo_api_url} onChange={(e) => setWaForm({ ...waForm, evo_api_url: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onSave("email", { ...emailForm, smtp_host: emailForm.smtp_host || null, smtp_user: emailForm.smtp_user || null, smtp_from: emailForm.smtp_from || null })}>
          <Save className="h-4 w-4 mr-2" /> Salvar Email
        </Button>
        <Button onClick={() => onSave("whatsapp", { ...waForm, meta_app_id: waForm.meta_app_id || null, evo_api_url: waForm.evo_api_url || null })}>
          <Save className="h-4 w-4 mr-2" /> Salvar WhatsApp
        </Button>
      </div>
    </div>
  );
}

/* ─── Avisos ─── */
function AnnouncementsTab({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const data = getSetting("announcements") as { items?: Array<{ title: string; message: string; type: string; active: boolean }> };
  const [items, setItems] = useState(data.items ?? []);

  const addItem = () => {
    setItems([...items, { title: "", message: "", type: "info", active: true }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string | boolean) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" /> Painel de Avisos
          </CardTitle>
          <CardDescription>Avisos e atualizações visíveis para todos os usuários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aviso configurado.</p>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={item.active ? "default" : "secondary"}>
                  {item.active ? "Ativo" : "Inativo"}
                </Badge>
                <div className="flex gap-2">
                  <Switch checked={item.active} onCheckedChange={(v) => updateItem(idx, "active", v)} />
                  <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={item.title} onChange={(e) => updateItem(idx, "title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea value={item.message} onChange={(e) => updateItem(idx, "message", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={item.type} onValueChange={(v) => updateItem(idx, "type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Atenção</SelectItem>
                    <SelectItem value="success">Novidade</SelectItem>
                    <SelectItem value="error">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Aviso
          </Button>
        </CardContent>
      </Card>

      <Button onClick={() => onSave("announcements", { items })}>
        <Save className="h-4 w-4 mr-2" /> Salvar Avisos
      </Button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SuperAdminSettings() {
  const { isLoading, getSetting, updateSetting } = usePlatformSettings();

  const handleSave = (key: string, value: Record<string, unknown>) => {
    updateSetting.mutate({ key, value });
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl py-6 space-y-6">
        <PageHeader
          title="Configurações Globais"
          description="Gerencie branding, login, gateways e notificações da plataforma"
        />

        {isLoading ? (
          <SettingsSkeleton />
        ) : (
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="w-full flex overflow-x-auto">
              <TabsTrigger value="branding" className="flex-1 gap-1 text-xs sm:text-sm">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="login" className="flex-1 gap-1 text-xs sm:text-sm">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </TabsTrigger>
              <TabsTrigger value="gateways" className="flex-1 gap-1 text-xs sm:text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Gateways</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1 gap-1 text-xs sm:text-sm">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex-1 gap-1 text-xs sm:text-sm">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">Avisos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branding" className="mt-6">
              <BrandingTab getSetting={getSetting} onSave={handleSave} />
            </TabsContent>
            <TabsContent value="login" className="mt-6">
              <LoginTab getSetting={getSetting} onSave={handleSave} />
            </TabsContent>
            <TabsContent value="gateways" className="mt-6">
              <GatewaysTab getSetting={getSetting} onSave={handleSave} />
            </TabsContent>
            <TabsContent value="notifications" className="mt-6">
              <NotificationsTab getSetting={getSetting} onSave={handleSave} />
            </TabsContent>
            <TabsContent value="announcements" className="mt-6">
              <AnnouncementsTab getSetting={getSetting} onSave={handleSave} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
