import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "@/hooks/use-toast";

export interface Automation {
  id: string;
  company_id: string;
  name: string;
  type: string;
  channel: string;
  trigger_event: string | null;
  active: boolean;
  title_template: string;
  message_template: string;
  config_json: Record<string, unknown>;
  created_at: string;
}

export function useAutomations() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const companyId = profile?.company_id;

  const query = useQuery({
    queryKey: ["automations", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Automation[];
    },
    enabled: !!companyId,
  });

  const create = useMutation({
    mutationFn: async (auto: Omit<Automation, "id" | "created_at" | "company_id">) => {
      const { error } = await supabase.from("automations").insert({ ...auto, company_id: companyId! } as never);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast({ title: "Automação criada!" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Automation> & { id: string }) => {
      const { error } = await supabase.from("automations").update(fields as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast({ title: "Automação atualizada!" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast({ title: "Automação removida!" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("automations").update({ active } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
  });

  return {
    automations: query.data ?? [],
    loading: query.isLoading,
    create: create.mutate,
    update: update.mutate,
    remove: remove.mutate,
    toggleActive: toggleActive.mutate,
    isCreating: create.isPending,
  };
}
