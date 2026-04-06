import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export interface SocialPostMetrics {
  id: string;
  post_id: string;
  company_id: string;
  likes: number;
  comments: number;
  shares: number;
  fetched_at: string;
}

export function useSocialMetrics(postIds?: string[]) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ["social-metrics", companyId, postIds],
    enabled: !!companyId && !!postIds && postIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_post_metrics")
        .select("*")
        .eq("company_id", companyId!)
        .in("post_id", postIds!);
      if (error) throw error;
      return (data || []) as unknown as SocialPostMetrics[];
    },
  });

  const metricsMap = new Map(metrics.map((m) => [m.post_id, m]));

  const refreshMetrics = useMutation({
    mutationFn: async (postId?: string) => {
      const { data, error } = await supabase.functions.invoke("social-metrics", {
        body: postId ? { post_id: postId } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["social-metrics"] });
      toast.success(`Métricas atualizadas (${data?.updated || 0} posts)`);
    },
    onError: (err: any) => {
      toast.error("Erro ao buscar métricas: " + err.message);
    },
  });

  return { metrics, metricsMap, isLoading, refreshMetrics };
}
