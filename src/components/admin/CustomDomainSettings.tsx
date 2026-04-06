import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Globe, Loader2, CheckCircle2, AlertCircle, Info, Copy } from "lucide-react";

export function CustomDomainSettings() {
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

  const [domain, setDomain] = useState("");

  useEffect(() => {
    if (company) {
      setDomain(company.custom_domain || "");
    }
  }, [company]);

  const saveDomainMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("companies")
        .update({
          custom_domain: domain.trim().toLowerCase() || null,
          domain_verified: false,
        })
        .eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast.success("Domínio salvo!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { custom_domain: domain.trim().toLowerCase() },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["company-theme"] });
      if (data.verified) {
        toast.success("Domínio verificado com sucesso!");
      } else {
        toast.warning(data.message || "Domínio não verificado. Verifique o DNS.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyTxt = () => {
    navigator.clipboard.writeText(companyId || "");
    toast.success("ID copiado!");
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  const isVerified = company?.domain_verified;
  const hasDomain = !!company?.custom_domain;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domínio Customizado
          </CardTitle>
          <CardDescription>Use seu próprio domínio para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domínio</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="app.suaigreja.com.br"
            />
          </div>

          {hasDomain && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              {isVerified ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => saveDomainMutation.mutate()}
              disabled={saveDomainMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {saveDomainMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Domínio
            </Button>
            {hasDomain && (
              <Button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="flex-1"
              >
                {verifyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verificar DNS
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Instruções de Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="space-y-3">
              <p className="font-medium">Para conectar seu domínio:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Acesse o painel DNS do seu provedor de domínio
                </li>
                <li>
                  Adicione um registro <strong>CNAME</strong> apontando para:
                  <code className="ml-2 px-2 py-0.5 bg-muted rounded text-xs font-mono">
                    app.pascomfy.com
                  </code>
                </li>
                <li>
                  Ou adicione um registro <strong>TXT</strong> em{" "}
                  <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                    _pascomfy.seudominio.com
                  </code>{" "}
                  com o valor:
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-muted rounded text-xs font-mono flex-1 truncate">
                      {companyId}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyTxt}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
                <li>
                  Aguarde a propagação DNS (até 48h) e clique em "Verificar DNS"
                </li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
