import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptions = () => {
  const queryClient = useQueryClient();

  const subscriptions = useQuery({
    queryKey: ["superadmin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, companies(name), plans(name, price_monthly)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; plan_id?: string; ends_at?: string | null }) => {
      const { error } = await supabase.from("subscriptions").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
    },
  });

  return { ...subscriptions, updateSubscription };
};
