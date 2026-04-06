import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AutomationConfig {
  automacao_ativa: boolean;
  canal_padrao: string;
  tempo_padrao_horas: number;
}

const DEFAULTS: AutomationConfig = {
  automacao_ativa: true,
  canal_padrao: "in_app",
  tempo_padrao_horas: 24,
};

export function AutomationSettings() {
  const { profile } = useProfile();
  const [config, setConfig] = useState<AutomationConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase.from("companies").select("settings").eq("id", profile.company_id).single().then(({ data }) => {
      if (data?.settings) {
        const s = data.settings as Record<string, unknown>;
        setConfig({
          automacao_ativa: (s.automacao_ativa as boolean) ?? DEFAULTS.automacao_ativa,
          canal_padrao: (s.canal_padrao as string) ?? DEFAULTS.canal_padrao,
          tempo_padrao_horas: (s.tempo_padrao_horas as number) ?? DEFAULTS.tempo_padrao_horas,
        });
      }
      setLoaded(true);
    });
  }, [profile?.company_id]);

  const handleSave = async () => {
    if (!profile?.company_id) return;
    setSaving(true);
    try {
      const { data: current } = await supabase.from("companies").select("settings").eq("id", profile.company_id).single();
      const merged = { ...((current?.settings as Record<string, unknown>) || {}), ...config };
      const { error } = await supabase.from("companies").update({ settings: merged } as never).eq("id", profile.company_id);
      if (error) throw error;
      toast({ title: "Configurações salvas!" });
    } catch (e: unknown) {
      toast({ title: "Erro ao salvar", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <p className="text-sm text-muted-foreground p-4">Carregando...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Settings2 className="h-5 w-5" />Configurações de Automação</CardTitle>
        <CardDescription>Configurações globais aplicadas a todas automações da empresa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">Automações ativas</Label>
            <p className="text-xs text-muted-foreground">Ativar ou desativar todas automações</p>
          </div>
          <Switch checked={config.automacao_ativa} onCheckedChange={(v) => setConfig((c) => ({ ...c, automacao_ativa: v }))} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Canal padrão</Label>
            <Select value={config.canal_padrao} onValueChange={(v) => setConfig((c) => ({ ...c, canal_padrao: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Tempo padrão de envio</Label>
            <Select value={String(config.tempo_padrao_horas)} onValueChange={(v) => setConfig((c) => ({ ...c, tempo_padrao_horas: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Imediato</SelectItem>
                <SelectItem value="1">1 hora antes</SelectItem>
                <SelectItem value="2">2 horas antes</SelectItem>
                <SelectItem value="6">6 horas antes</SelectItem>
                <SelectItem value="12">12 horas antes</SelectItem>
                <SelectItem value="24">24 horas antes</SelectItem>
                <SelectItem value="48">48 horas antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
