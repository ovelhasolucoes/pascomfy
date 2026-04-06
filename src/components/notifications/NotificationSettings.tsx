import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, MessageSquare, Mail, Loader2 } from "lucide-react";

export function NotificationSettings() {
  const { settings, isLoading, updateSettings } = useNotificationSettings();
  const { isSubscribed, isLoading: pushLoading, isSupported, subscribe, unsubscribe } = usePushSubscription();

  if (isLoading) return <div className="text-muted-foreground text-sm">Carregando...</div>;

  const pushEnabled = settings?.push_enabled ?? true;
  const whatsappEnabled = settings?.whatsapp_enabled ?? false;
  const emailEnabled = settings?.email_enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preferências de Notificação</CardTitle>
        <CardDescription>Escolha como deseja receber suas notificações</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="push">Notificações Push</Label>
          </div>
          <Switch
            id="push"
            checked={pushEnabled}
            onCheckedChange={(checked) => updateSettings({ push_enabled: checked })}
          />
        </div>

        {pushEnabled && isSupported && (
          <div className="ml-7 flex items-center gap-2">
            {isSubscribed ? (
              <Button variant="outline" size="sm" onClick={unsubscribe} disabled={pushLoading}>
                {pushLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Desativar neste dispositivo
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={subscribe} disabled={pushLoading}>
                {pushLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Ativar neste dispositivo
              </Button>
            )}
          </div>
        )}

        {pushEnabled && !isSupported && (
          <p className="ml-7 text-xs text-muted-foreground">
            Push não disponível neste navegador/ambiente.
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="whatsapp">WhatsApp</Label>
          </div>
          <Switch
            id="whatsapp"
            checked={whatsappEnabled}
            onCheckedChange={(checked) => updateSettings({ whatsapp_enabled: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email">E-mail (em breve)</Label>
          </div>
          <Switch id="email" checked={emailEnabled} disabled />
        </div>
      </CardContent>
    </Card>
  );
}
