import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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

export default function SocialAccounts() {
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
    desconectado: { label: "Desconectado", icon: AlertCircle, badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  const isTokenExpiring = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysLeft = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft < 7;
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contas Meta</h1>
            <p className="text-sm text-muted-foreground">Conecte suas páginas do Facebook e Instagram</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
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
                <Button
                  onClick={handleCreate}
                  disabled={createAccount.isPending || !appId || !appSecret}
                  className="w-full"
                >
                  Salvar e continuar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 mx-auto mb-4 flex items-center justify-center">
              <Facebook className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium">Nenhuma conta conectada</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione suas credenciais Meta para começar a publicar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account: any) => {
              const config = statusConfig[account.status] || statusConfig.pendente;
              const StatusIcon = config.icon;
              const expiring = isTokenExpiring(account.token_expires_at);

              return (
                <Card key={account.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(account.page_name || "M").charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-lg">{account.page_name || `App ${account.app_id}`}</span>
                          <Badge className={`${config.badgeClass} border text-xs gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                          {expiring && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                              <RefreshCw className="h-3 w-3" /> Token expirando
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {account.page_id && (
                            <span className="flex items-center gap-1">
                              <Facebook className="h-3.5 w-3.5 text-blue-600" /> {account.page_id}
                            </span>
                          )}
                          {account.instagram_username && (
                            <span className="flex items-center gap-1">
                              <Instagram className="h-3.5 w-3.5 text-pink-600" /> @{account.instagram_username}
                            </span>
                          )}
                          {account.token_expires_at && (
                            <span>Expira: {format(new Date(account.token_expires_at), "dd/MM/yyyy")}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <MetaConnectButton
                          oauthUrl={getOAuthUrl(account.id, account.app_id)}
                          status={account.status}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAccount.mutate(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
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
    </AppLayout>
  );
}
