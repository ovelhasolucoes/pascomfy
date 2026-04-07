import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BiolinkTemplate {
  id: string;
  company_id: string | null;
  nome: string;
  descricao: string | null;
  categoria: string;
  preview_config: Record<string, any>;
  created_at: string;
}

export interface BiolinkTemplateItem {
  id: string;
  template_id: string;
  titulo: string;
  tipo: string;
  icone: string | null;
  ordem: number;
  url_placeholder: string;
  ativo: boolean;
}

export function useBiolinkTemplates() {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["biolink-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biolink_templates" as any)
        .select("*")
        .order("categoria", { ascending: true });
      if (error) throw error;
      return data as unknown as BiolinkTemplate[];
    },
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["biolink-template-items", templates.map((t) => t.id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biolink_template_items" as any)
        .select("*")
        .in("template_id", templates.map((t) => t.id))
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as unknown as BiolinkTemplateItem[];
    },
    enabled: templates.length > 0,
  });

  const getTemplateItems = (templateId: string) =>
    allItems.filter((i) => i.template_id === templateId);

  return { templates, allItems, getTemplateItems, isLoading };
}
