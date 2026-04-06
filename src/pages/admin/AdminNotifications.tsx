import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { AutomationList } from "@/components/notifications/AutomationList";
import { ManualDispatch } from "@/components/notifications/ManualDispatch";
import { AutomationLogs } from "@/components/notifications/AutomationLogs";
import { AutomationSettings } from "@/components/notifications/AutomationSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Send, BarChart3, Settings2, Bell } from "lucide-react";

export default function AdminNotifications() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações & Automações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie automações, envios manuais e acompanhe os logs</p>
        </div>
        <Tabs defaultValue="automations">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="automations" className="gap-1.5"><Zap className="h-3.5 w-3.5" />Automações</TabsTrigger>
            <TabsTrigger value="dispatch" className="gap-1.5"><Send className="h-3.5 w-3.5" />Disparo Manual</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Logs</TabsTrigger>
            <TabsTrigger value="config" className="gap-1.5"><Settings2 className="h-3.5 w-3.5" />Configurações</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Preferências</TabsTrigger>
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
          <TabsContent value="config" className="mt-4">
            <AutomationSettings />
          </TabsContent>
          <TabsContent value="preferences" className="mt-4">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
