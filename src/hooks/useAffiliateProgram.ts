import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

function generateCode(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useAffiliateProgram() {
  const { profile } = useProfile();
  const companyId = profile?.company_id;
  const queryClient = useQueryClient();

  const { data: program, isLoading: loadingProgram } = useQuery({
    queryKey: ["affiliate-program", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("affiliate_program")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createProgram = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const code = generateCode();
      const { data, error } = await supabase
        .from("affiliate_program")
        .insert({ company_id: companyId, code, active: true } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliate-program"] }),
  });

  const { data: referrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ["affiliate-referrals", program?.id],
    queryFn: async () => {
      if (!program?.id) return [];
      const { data, error } = await supabase
        .from("affiliate_referrals")
        .select("*, companies:referred_company_id(name)")
        .eq("affiliate_id", program.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!program?.id,
  });

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ["affiliate-rewards", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("affiliate_rewards" as any)
        .select("*")
        .eq("affiliate_company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!companyId,
  });

  return {
    program,
    loadingProgram,
    createProgram,
    referrals: referrals || [],
    loadingReferrals,
    rewards: rewards || [],
    loadingRewards,
  };
}
