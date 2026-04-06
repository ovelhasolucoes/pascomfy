import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { MetaConnectButton } from "@/components/social/MetaConnectButton";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function SocialAccounts() {
  const { accounts, isLoading, createAccount, deleteAccount, getOAuthUrl } = useSocialAccounts();
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");

  const handleCreate = () => {
    if (!appId.trim() || !appSecret.trim()) return;
    createAccount.mutate({ appId: appId.trim(), appSecret: appSecret.trim() });
    setAppId("");
    setAppSecret("");
  };

  const statusConfig: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ativo: { label: "Conectado", icon: CheckCircle2, variant: "default" },
    erro: { label: "Erro", icon: AlertCircle, variant: "destructive" },
    pendente: { label: "Pendente", icon: Clock, variant: "outline" },
    desconectado: { label: "Desconectado", icon: AlertCircle, variant: "secondary" },
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-bold">Contas Meta</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar nova conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Insira as credenciais do seu Meta App. Você pode criar um em{" "}
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                developers.facebook.com <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>App ID</Label>
                <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Ex: 123456789" />
              </div>
              <div>
                <Label>App Secret</Label>
                <Input value={appSecret} onChange={(e) => setAppSecret(e.target.value)} type="password" placeholder="Ex: abc123..." />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createAccount.isPending || !appId || !appSecret}>
              Salvar credenciais
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma conta configurada.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account: any) => {
              const config = statusConfig[account.status] || statusConfig.pendente;
              const StatusIcon = config.icon;

              return (
                <Card key={account.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.page_name || `App ${account.app_id}`}</span>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-x-3">
                        {account.page_id && <span>Page: {account.page_id}</span>}
                        {account.instagram_username && <span>IG: @{account.instagram_username}</span>}
                        {account.token_expires_at && (
                          <span>Token expira: {format(new Date(account.token_expires_at), "dd/MM/yyyy")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MetaConnectButton
                        oauthUrl={getOAuthUrl(account.id, account.app_id)}
                        status={account.status}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAccount.mutate(account.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
