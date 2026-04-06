import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export function useSocialAccounts() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["social-accounts", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      // Use the safe view (no tokens exposed)
      const { data, error } = await supabase
        .from("social_accounts_safe" as any)
        .select("*")
        .eq("company_id", companyId!);
      if (error) throw error;
      return data || [];
    },
  });

  const createAccount = useMutation({
    mutationFn: async ({ appId, appSecret }: { appId: string; appSecret: string }) => {
      const { data, error } = await supabase
        .from("social_accounts")
        .insert({
          company_id: companyId!,
          app_id: appId,
          app_secret_encrypted: appSecret,
          status: "pendente",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Conta criada! Agora conecte com o Facebook.");
    },
    onError: (err: any) => {
      toast.error("Erro ao criar conta: " + err.message);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Conta removida.");
    },
  });

  const getOAuthUrl = (accountId: string, appId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth`;
    const state = `${companyId}:${accountId}`;
    const scopes = "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish";
    return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
  };

  return { accounts, isLoading, createAccount, deleteAccount, getOAuthUrl };
}
