import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { AutomationList } from "@/components/notifications/AutomationList";
import { ManualDispatch } from "@/components/notifications/ManualDispatch";
import { AutomationLogs } from "@/components/notifications/AutomationLogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminNotifications() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Notificações & Automações</h1>
        <Tabs defaultValue="automations">
          <TabsList>
            <TabsTrigger value="automations">Automações</TabsTrigger>
            <TabsTrigger value="dispatch">Disparo Manual</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="settings">Preferências</TabsTrigger>
          </TabsList>
          <TabsContent value="automations" className="mt-4">
            <AutomationList />
          </TabsContent>
          <TabsContent value="dispatch" className="mt-4">
            <ManualDispatch />
          </TabsContent>
          <TabsContent value="logs" className="mt-4">
            <AutomationLogs />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
