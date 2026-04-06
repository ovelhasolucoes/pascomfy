import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MessageSquare, FileText, Calendar, Palette, Globe, Trophy } from "lucide-react";
import { CompanySettings } from "@/components/admin/CompanySettings";
import { WhatsAppConfig } from "@/components/notifications/WhatsAppConfig";
import { NotificationTemplates } from "@/components/admin/NotificationTemplates";
import { EventSettingsContent } from "@/components/admin/EventSettingsContent";
import { WhiteLabelSettings } from "@/components/admin/WhiteLabelSettings";
import { CustomDomainSettings } from "@/components/admin/CustomDomainSettings";
import { GamificationSettings } from "@/components/admin/GamificationSettings";
import { useCompanyTheme } from "@/contexts/CompanyThemeContext";

const AdminSettings = () => {
  const { isWhitelabel } = useCompanyTheme();

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie sua empresa, integrações e preferências</p>
        </div>

        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="company" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="gamification" className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" />
              Gamificação
            </TabsTrigger>
            {isWhitelabel && (
              <TabsTrigger value="whitelabel" className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                Personalização
              </TabsTrigger>
            )}
            <TabsTrigger value="domain" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Domínio
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <CompanySettings />
          </TabsContent>

          <TabsContent value="events">
            <EventSettingsContent />
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationSettings />
          </TabsContent>

          {isWhitelabel && (
            <TabsContent value="whitelabel">
              <WhiteLabelSettings />
            </TabsContent>
          )}

          <TabsContent value="domain">
            <CustomDomainSettings />
          </TabsContent>

          <TabsContent value="whatsapp">
            <WhatsAppConfig />
          </TabsContent>

          <TabsContent value="templates">
            <NotificationTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
