import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { MessageSquare, Globe, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const SuperAdminIntegrations = () => {
  const { isLoading, getSetting, updateSetting } = usePlatformSettings();

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="container max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Integrações Globais</h1>
        <p className="text-sm text-muted-foreground">
          Configurações globais de integrações que se aplicam a todas as empresas da plataforma.
        </p>

        <WhatsAppSection getSetting={getSetting} onSave={(key, value) => updateSetting.mutate({ key, value })} />
        <MetaSection getSetting={getSetting} onSave={(key, value) => updateSetting.mutate({ key, value })} />
      </div>
    </SuperAdminLayout>
  );
};

function WhatsAppSection({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const wa = getSetting("whatsapp") as Record<string, string | null>;
  const [form, setForm] = useState({
    default_provider: (wa.default_provider as string) ?? "meta",
    meta_app_id: (wa.meta_app_id as string) ?? "",
    evo_api_url: (wa.evo_api_url as string) ?? "",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" /> WhatsApp
        </CardTitle>
        <CardDescription>Provedor padrão e credenciais globais do WhatsApp</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provedor Padrão</Label>
          <Select value={form.default_provider} onValueChange={(v) => setForm({ ...form, default_provider: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="meta">Meta (Cloud API)</SelectItem>
              <SelectItem value="evo">Evolution API</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Meta App ID</Label>
          <Input value={form.meta_app_id} onChange={(e) => setForm({ ...form, meta_app_id: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Evolution API URL</Label>
          <Input placeholder="https://evo.exemplo.com" value={form.evo_api_url} onChange={(e) => setForm({ ...form, evo_api_url: e.target.value })} />
        </div>
        <Button onClick={() => onSave("whatsapp", { ...form, meta_app_id: form.meta_app_id || null, evo_api_url: form.evo_api_url || null })}>
          <Save className="h-4 w-4 mr-2" /> Salvar WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}

function MetaSection({ getSetting, onSave }: {
  getSetting: (k: string) => Record<string, unknown>;
  onSave: (key: string, value: Record<string, unknown>) => void;
}) {
  const meta = getSetting("meta_api") as Record<string, string | null>;
  const [form, setForm] = useState({
    app_id: (meta.app_id as string) ?? "",
    app_secret: (meta.app_secret as string) ?? "",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" /> Meta API
        </CardTitle>
        <CardDescription>Credenciais globais para integração com Facebook/Instagram</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>App ID</Label>
          <Input value={form.app_id} onChange={(e) => setForm({ ...form, app_id: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>App Secret</Label>
          <Input type="password" value={form.app_secret} onChange={(e) => setForm({ ...form, app_secret: e.target.value })} />
        </div>
        <Button onClick={() => onSave("meta_api", { app_id: form.app_id || null, app_secret: form.app_secret || null })}>
          <Save className="h-4 w-4 mr-2" /> Salvar Meta API
        </Button>
      </CardContent>
    </Card>
  );
}

export default SuperAdminIntegrations;
