import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface NotificationSettings {
  id: string;
  user_id: string;
  company_id: string;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
}

export function useNotificationSettings() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["notification-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NotificationSettings | null;
    },
    enabled: !!user,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Partial<Pick<NotificationSettings, "push_enabled" | "whatsapp_enabled" | "email_enabled">>) => {
      if (settings) {
        const { error } = await supabase
          .from("user_notification_settings")
          .update(updates)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_notification_settings")
          .insert({
            user_id: user!.id,
            company_id: profile!.company_id!,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings", user?.id] });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: upsertSettings.mutate,
  };
}
