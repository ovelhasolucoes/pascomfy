import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useCompanyTheme } from "@/contexts/CompanyThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Globe, Loader2, CheckCircle2, AlertCircle, Info, Copy,
  Lock, ArrowRight, ShieldCheck, Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CustomDomainSettings() {
  const { profile } = useProfile();
  const { allowsCustomDomain } = useCompanyTheme();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Plan gate: show upgrade message
  if (!allowsCustomDomain) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-foreground">Domínio Customizado</h3>
              <p className="text-sm text-muted-foreground">
                Use seu próprio domínio para acessar o sistema. Esse recurso está disponível em planos superiores.
              </p>
            </div>
            <Button onClick={() => navigate("/admin/my-subscription")} className="mt-2">
              <ArrowRight className="h-4 w-4 mr-2" />
              Ver planos e fazer upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerified = company?.domain_verified;
  const hasDomain = !!company?.custom_domain;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
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
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <span className="text-sm text-muted-foreground">Status:</span>
              {isVerified ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verificado
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                  <Clock className="h-3 w-3" />
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
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verificar DNS
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Como configurar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3">
              {[
                {
                  step: "1",
                  title: "Acesse o painel DNS",
                  desc: "Vá ao seu provedor de domínio (GoDaddy, Registro.br, Cloudflare, etc.)",
                },
                {
                  step: "2",
                  title: "Adicione um registro CNAME",
                  desc: (
                    <>
                      Aponte para:{" "}
                      <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                        app.pascomfy.com
                      </code>
                    </>
                  ),
                },
                {
                  step: "3",
                  title: "Ou use verificação TXT",
                  desc: (
                    <div className="space-y-1.5">
                      <span>
                        Crie um registro TXT em{" "}
                        <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                          _pascomfy.seudominio.com
                        </code>
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono flex-1 truncate">
                          {companyId}
                        </code>
                        <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={copyTxt}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ),
                },
                {
                  step: "4",
                  title: "Verifique",
                  desc: "Aguarde até 48h para propagação DNS e clique em \"Verificar DNS\"",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {step}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{title}</p>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
