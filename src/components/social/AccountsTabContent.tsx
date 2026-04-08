import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, ExternalLink, CheckCircle2, AlertCircle, Clock, Plus, Facebook, Instagram, RefreshCw, Shield } from "lucide-react";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { MetaConnectButton } from "@/components/social/MetaConnectButton";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AccountsTabContent() {
  const { accounts, isLoading, createAccount, deleteAccount, getOAuthUrl } = useSocialAccounts();
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!appId.trim() || !appSecret.trim()) return;
    createAccount.mutate({ appId: appId.trim(), appSecret: appSecret.trim() });
    setAppId("");
    setAppSecret("");
    setDialogOpen(false);
  };

  const statusConfig: Record<string, { label: string; icon: any; badgeClass: string }> = {
    ativo: { label: "Conectado", icon: CheckCircle2, badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    erro: { label: "Erro", icon: AlertCircle, badgeClass: "bg-red-100 text-red-700 border-red-200" },
    pendente: { label: "Pendente", icon: Clock, badgeClass: "bg-amber-100 text-amber-700 border-amber-200" },
    desconectado: { label: "Desconectado", icon: AlertCircle, badgeClass: "bg-muted text-muted-foreground border-border" },
  };

  const isTokenExpiring = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft < 7;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar conta Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1">
                  <Shield className="h-4 w-4" /> Como obter as credenciais
                </p>
                <p>1. Acesse <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="h-3 w-3" /></a></p>
                <p>2. Crie ou selecione seu App</p>
                <p>3. Copie o App ID e App Secret</p>
              </div>
              <div>
                <Label>App ID</Label>
                <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Ex: 123456789" className="mt-1" />
              </div>
              <div>
                <Label>App Secret</Label>
                <Input value={appSecret} onChange={(e) => setAppSecret(e.target.value)} type="password" placeholder="Ex: abc123..." className="mt-1" />
              </div>
              <Button onClick={handleCreate} disabled={createAccount.isPending || !appId || !appSecret} className="w-full">
                Salvar e continuar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Facebook className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium">Nenhuma conta conectada</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione suas credenciais Meta para começar a publicar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account: any) => {
            const config = statusConfig[account.status] || statusConfig.pendente;
            const StatusIcon = config.icon;
            const expiring = isTokenExpiring(account.token_expires_at);

            return (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      {(account.page_name || "M").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg">{account.page_name || `App ${account.app_id}`}</span>
                        <Badge className={`${config.badgeClass} border text-xs gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {expiring && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <RefreshCw className="h-3 w-3" /> Token expirando
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        {account.page_id && (
                          <span className="flex items-center gap-1">
                            <Facebook className="h-3.5 w-3.5" /> {account.page_id}
                          </span>
                        )}
                        {account.instagram_username && (
                          <span className="flex items-center gap-1">
                            <Instagram className="h-3.5 w-3.5" /> @{account.instagram_username}
                          </span>
                        )}
                        {account.token_expires_at && (
                          <span>Expira: {format(new Date(account.token_expires_at), "dd/MM/yyyy")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MetaConnectButton oauthUrl={getOAuthUrl(account.id, account.app_id)} status={account.status} />
                      <Button variant="ghost" size="icon" onClick={() => deleteAccount.mutate(account.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
