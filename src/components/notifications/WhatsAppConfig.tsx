import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Save } from "lucide-react";

interface WhatsAppConfigData {
  id?: string;
  provider: "meta" | "evo";
  config_json: {
    token?: string;
    phone_id?: string;
    base_url?: string;
    instance?: string;
  };
  active: boolean;
}

export function WhatsAppConfig() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: config, isLoading } = useQuery({
    queryKey: ["whatsapp-config", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("company_id", companyId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as WhatsAppConfigData | null;
    },
    enabled: !!companyId,
  });

  const [provider, setProvider] = useState<"meta" | "evo">("meta");
  const [token, setToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [instance, setInstance] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setToken((config.config_json as Record<string, string>)?.token || "");
      setPhoneId((config.config_json as Record<string, string>)?.phone_id || "");
      setBaseUrl((config.config_json as Record<string, string>)?.base_url || "");
      setInstance((config.config_json as Record<string, string>)?.instance || "");
      setActive(config.active);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const configJson = provider === "meta"
        ? { token, phone_id: phoneId }
        : { token, base_url: baseUrl, instance };

      if (config?.id) {
        const { error } = await supabase
          .from("whatsapp_configs")
          .update({ provider, config_json: configJson, active })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_configs")
          .insert({ company_id: companyId!, provider, config_json: configJson, active });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config", companyId] });
      toast({ title: "Configuração salva!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Configuração WhatsApp
        </CardTitle>
        <CardDescription>Configure o envio de mensagens via WhatsApp</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Ativo</Label>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as "meta" | "evo")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="meta">Meta (API Oficial)</SelectItem>
              <SelectItem value="evo">Evo API</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Token de acesso</Label>
          <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token..." />
        </div>
        {provider === "meta" ? (
          <div className="space-y-2">
            <Label>Phone Number ID</Label>
            <Input value={phoneId} onChange={(e) => setPhoneId(e.target.value)} placeholder="Ex: 123456789" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com" />
            </div>
            <div className="space-y-2">
              <Label>Instância</Label>
              <Input value={instance} onChange={(e) => setInstance(e.target.value)} placeholder="Nome da instância" />
            </div>
          </>
        )}
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardContent>
    </Card>
  );
}
