import { AppLayout } from "@/components/layout/AppLayout";
import { AdminNotificationSend } from "@/components/notifications/AdminNotificationSend";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminNotifications() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
        <Tabs defaultValue="send">
          <TabsList>
            <TabsTrigger value="send">Enviar</TabsTrigger>
            <TabsTrigger value="settings">Minhas Preferências</TabsTrigger>
          </TabsList>
          <TabsContent value="send" className="mt-4">
            <AdminNotificationSend />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
