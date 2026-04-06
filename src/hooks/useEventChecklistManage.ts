import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export const useEventChecklistManage = (eventId?: string) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const addChecklistFromTemplate = useMutation({
    mutationFn: async (params: { templateId: string; eventTeamId?: string }) => {
      // Get template info
      const { data: tmpl, error: tErr } = await supabase
        .from("checklist_templates")
        .select("id, name")
        .eq("id", params.templateId)
        .single();
      if (tErr) throw tErr;

      // Get template items
      const { data: tmplItems, error: tiErr } = await supabase
        .from("checklist_template_items")
        .select("title, description, display_order, is_required")
        .eq("template_id", params.templateId)
        .order("display_order", { ascending: true });
      if (tiErr) throw tiErr;

      // Create event checklist
      const { data: ecl, error: ecErr } = await supabase
        .from("event_checklists")
        .insert({
          event_id: eventId!,
          company_id: profile!.company_id!,
          name: tmpl.name,
          template_id: params.templateId,
          event_team_id: params.eventTeamId || null,
        })
        .select("id")
        .single();
      if (ecErr) throw ecErr;

      // Copy items
      if (tmplItems && tmplItems.length > 0) {
        const { error: iErr } = await supabase
          .from("event_checklist_items")
          .insert(
            tmplItems.map((item) => ({
              event_checklist_id: ecl.id,
              company_id: profile!.company_id!,
              title: item.title,
              description: item.description,
              display_order: item.display_order,
              is_required: item.is_required,
              scope: "shared",
            }))
          );
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_checklists", eventId] }),
  });

  const addAdHocChecklist = useMutation({
    mutationFn: async (params: {
      name: string;
      eventTeamId?: string;
      items: { title: string; description?: string; is_required: boolean; scope: string }[];
    }) => {
      const { data: ecl, error: ecErr } = await supabase
        .from("event_checklists")
        .insert({
          event_id: eventId!,
          company_id: profile!.company_id!,
          name: params.name,
          event_team_id: params.eventTeamId || null,
        })
        .select("id")
        .single();
      if (ecErr) throw ecErr;

      if (params.items.length > 0) {
        const { error: iErr } = await supabase
          .from("event_checklist_items")
          .insert(
            params.items.map((item, idx) => ({
              event_checklist_id: ecl.id,
              company_id: profile!.company_id!,
              title: item.title,
              description: item.description || null,
              display_order: idx,
              is_required: item.is_required,
              scope: item.scope,
            }))
          );
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_checklists", eventId] }),
  });

  const deleteChecklist = useMutation({
    mutationFn: async (checklistId: string) => {
      // Delete progress first, then items, then checklist
      const { data: items } = await supabase
        .from("event_checklist_items")
        .select("id")
        .eq("event_checklist_id", checklistId);
      
      if (items && items.length > 0) {
        const itemIds = items.map((i) => i.id);
        await supabase.from("event_checklist_progress").delete().in("event_checklist_item_id", itemIds);
        await supabase.from("event_checklist_items").delete().eq("event_checklist_id", checklistId);
      }
      
      const { error } = await supabase.from("event_checklists").delete().eq("id", checklistId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_checklists", eventId] }),
  });

  return { addChecklistFromTemplate, addAdHocChecklist, deleteChecklist };
};
