import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePayments = () => {
  const queryClient = useQueryClient();

  const payments = useQuery({
    queryKey: ["superadmin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, companies(name), subscriptions(plan_id, plans(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const callBilling = useMutation({
    mutationFn: async (payload: { action: string; [key: string]: any }) => {
      const { data, error } = await supabase.functions.invoke("asaas-billing", {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-subscriptions"] });
    },
  });

  return { ...payments, callBilling };
};
