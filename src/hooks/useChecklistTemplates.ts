import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface TemplateItem {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  is_required: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
}

export const useChecklistTemplates = () => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["checklist_templates", profile?.company_id],
    queryFn: async () => {
      const { data: templates, error } = await supabase
        .from("checklist_templates")
        .select("id, name, description")
        .eq("company_id", profile!.company_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const templateIds = (templates || []).map((t) => t.id);
      let items: TemplateItem[] = [];
      if (templateIds.length > 0) {
        const { data, error: iErr } = await supabase
          .from("checklist_template_items")
          .select("id, title, description, display_order, is_required, template_id")
          .in("template_id", templateIds)
          .order("display_order", { ascending: true });
        if (iErr) throw iErr;
        items = (data || []) as any;
      }

      return (templates || []).map((t) => ({
        ...t,
        items: items.filter((i: any) => i.template_id === t.id),
      })) as ChecklistTemplate[];
    },
    enabled: !!profile?.company_id,
  });

  const createTemplate = useMutation({
    mutationFn: async (params: { name: string; description?: string; items: { title: string; description?: string; is_required: boolean; scope: string }[] }) => {
      const { data: tmpl, error } = await supabase
        .from("checklist_templates")
        .insert({
          name: params.name,
          description: params.description || null,
          company_id: profile!.company_id!,
          created_by: profile!.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (params.items.length > 0) {
        const { error: iErr } = await supabase
          .from("checklist_template_items")
          .insert(
            params.items.map((item, idx) => ({
              template_id: tmpl.id,
              company_id: profile!.company_id!,
              title: item.title,
              description: item.description || null,
              display_order: idx,
              is_required: item.is_required,
            }))
          );
        if (iErr) throw iErr;
      }
      return tmpl.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist_templates"] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // Items cascade via FK
      const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checklist_templates"] }),
  });

  return {
    templates: query.data ?? [],
    loading: query.isLoading,
    createTemplate,
    deleteTemplate,
  };
};
