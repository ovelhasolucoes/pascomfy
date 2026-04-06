import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";

interface SendNotificationParams {
  title: string;
  message: string;
  type: "escala" | "evento" | "aviso" | "sistema";
  userIds: string[];
}

export function useAdminNotifications() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const sendNotification = useMutation({
    mutationFn: async ({ title, message, type, userIds }: SendNotificationParams) => {
      const companyId = profile!.company_id!;
      const rows = userIds.map((uid) => ({
        company_id: companyId,
        user_id: uid,
        title,
        message,
        type,
      }));

      const { error } = await supabase
        .from("notifications")
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Notificações enviadas com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar notificações", description: error.message, variant: "destructive" });
    },
  });

  return {
    sendNotification: sendNotification.mutate,
    isSending: sendNotification.isPending,
  };
}
