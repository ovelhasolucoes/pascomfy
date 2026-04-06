import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export interface SocialPost {
  id: string;
  company_id: string;
  social_account_id: string;
  caption: string | null;
  media_type: string | null;
  media_urls: string[];
  platform: string;
  status: string;
  error_message: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  meta_post_id: string | null;
  meta_ig_post_id: string | null;
  created_by: string;
  created_at: string;
}

export function useSocialPosts(statusFilter?: string) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["social-posts", companyId, statusFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let query = supabase
        .from("social_posts")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "todos") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SocialPost[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (post: {
      social_account_id: string;
      caption: string;
      media_type?: string;
      media_urls?: string[];
      platform: string;
      scheduled_at?: string | null;
    }) => {
      const status = post.scheduled_at ? "agendado" : "rascunho";
      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          company_id: companyId!,
          social_account_id: post.social_account_id,
          caption: post.caption,
          media_type: post.media_type || null,
          media_urls: post.media_urls || [],
          platform: post.platform,
          status,
          scheduled_at: post.scheduled_at || null,
          created_by: profile!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast.success("Post criado!");
    },
    onError: (err: any) => {
      toast.error("Erro ao criar post: " + err.message);
    },
  });

  const publishPost = useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke("social-publish", {
        body: { post_id: postId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      if (data?.success) {
        toast.success("Post publicado com sucesso!");
      } else {
        toast.error("Erro na publicação: " + (data?.errors?.join(", ") || "Erro desconhecido"));
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao publicar: " + err.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast.success("Post removido.");
    },
  });

  return { posts, isLoading, createPost, publishPost, deletePost };
}
