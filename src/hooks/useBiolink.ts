import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export interface Biolink {
  id: string;
  company_id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  ativo: boolean;
  created_at: string;
}

export interface BiolinkItem {
  id: string;
  biolink_id: string;
  titulo: string;
  url: string;
  tipo: "link" | "whatsapp" | "youtube" | "instagram" | "facebook" | "doacao";
  icone: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  click_count?: number;
}

export function useBiolink() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const { data: biolink, isLoading } = useQuery({
    queryKey: ["biolink", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biolinks")
        .select("*")
        .eq("company_id", companyId!)
        .maybeSingle();
      if (error) throw error;
      return data as Biolink | null;
    },
    enabled: !!companyId,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["biolink-items", biolink?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biolink_items")
        .select("*")
        .eq("biolink_id", biolink!.id)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as BiolinkItem[];
    },
    enabled: !!biolink?.id,
  });

  const { data: clickCounts = {} } = useQuery({
    queryKey: ["biolink-clicks", biolink?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biolink_clicks")
        .select("biolink_item_id")
        .in("biolink_item_id", items.map((i) => i.id));
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((c) => {
        counts[c.biolink_item_id] = (counts[c.biolink_item_id] || 0) + 1;
      });
      return counts;
    },
    enabled: items.length > 0,
  });

  const createBiolink = useMutation({
    mutationFn: async (values: { slug: string; titulo: string; descricao?: string }) => {
      const { data, error } = await supabase
        .from("biolinks")
        .insert({ ...values, company_id: companyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biolink"] });
      toast.success("Biolink criado com sucesso!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateBiolink = useMutation({
    mutationFn: async (values: Partial<Biolink>) => {
      const { error } = await supabase
        .from("biolinks")
        .update(values)
        .eq("id", biolink!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biolink"] });
      toast.success("Biolink atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addItem = useMutation({
    mutationFn: async (values: { titulo: string; url: string; tipo: BiolinkItem["tipo"]; icone?: string }) => {
      const maxOrdem = items.length > 0 ? Math.max(...items.map((i) => i.ordem)) + 1 : 0;
      const { data, error } = await supabase
        .from("biolink_items")
        .insert({ ...values, biolink_id: biolink!.id, ordem: maxOrdem })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biolink-items"] });
      toast.success("Link adicionado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, click_count, ...values }: Partial<BiolinkItem> & { id: string }) => {
      const { error } = await supabase
        .from("biolink_items")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biolink-items"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("biolink_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biolink-items"] });
      toast.success("Link removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderItems = useMutation({
    mutationFn: async (reorderedItems: { id: string; ordem: number }[]) => {
      const promises = reorderedItems.map((item) =>
        supabase.from("biolink_items").update({ ordem: item.ordem }).eq("id", item.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biolink-items"] });
    },
  });

  const publicUrl = biolink
    ? `https://cchovdurprjtefisautg.supabase.co/functions/v1/biolink-page?slug=${biolink.slug}`
    : null;

  return {
    biolink,
    items,
    clickCounts,
    isLoading,
    itemsLoading,
    publicUrl,
    createBiolink,
    updateBiolink,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}
