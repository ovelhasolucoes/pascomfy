import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export const useSubstitutions = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const mySubstitutions = useQuery({
    queryKey: ["my_substitutions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_substitutions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const companySubstitutions = useQuery({
    queryKey: ["company_substitutions", profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_substitutions")
        .select(`
          *,
          profiles!event_substitutions_user_id_fkey(name, avatar_url),
          events(title, start_date)
        `)
        .eq("company_id", profile!.company_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const requestSubstitution = useMutation({
    mutationFn: async (params: {
      eventId: string;
      eventTeamMemberId: string;
      reason: string;
    }) => {
      // Check time limit from company settings
      const { data: company } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", profile!.company_id!)
        .single();

      const settings = company?.settings as Record<string, any> ?? {};
      const limitHours = settings.tempo_limite_substituicao ?? 24;

      // Get event start_date
      const { data: event } = await supabase
        .from("events")
        .select("start_date")
        .eq("id", params.eventId)
        .single();

      if (event) {
        const hoursUntil = (new Date(event.start_date).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < limitHours) {
          throw new Error(`Não é possível solicitar substituição com menos de ${limitHours}h de antecedência.`);
        }
      }

      const { error } = await supabase.from("event_substitutions").insert({
        company_id: profile!.company_id!,
        event_id: params.eventId,
        event_team_member_id: params.eventTeamMemberId,
        user_id: user!.id,
        reason: params.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_substitutions"] });
      queryClient.invalidateQueries({ queryKey: ["company_substitutions"] });
    },
  });

  const respondSubstitution = useMutation({
    mutationFn: async (params: {
      id: string;
      status: "aprovado" | "rejeitado";
      replacementUserId?: string;
    }) => {
      const { error } = await supabase
        .from("event_substitutions")
        .update({
          status: params.status,
          responded_by: user!.id,
          responded_at: new Date().toISOString(),
          replacement_user_id: params.replacementUserId ?? null,
        })
        .eq("id", params.id);
      if (error) throw error;

      // If approved and has replacement, update the team member
      if (params.status === "aprovado" && params.replacementUserId) {
        const { data: sub } = await supabase
          .from("event_substitutions")
          .select("event_team_member_id")
          .eq("id", params.id)
          .single();

        if (sub) {
          await supabase
            .from("event_team_members")
            .update({
              user_id: params.replacementUserId,
              status: "pendente",
            })
            .eq("id", sub.event_team_member_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_substitutions"] });
      queryClient.invalidateQueries({ queryKey: ["company_substitutions"] });
      queryClient.invalidateQueries({ queryKey: ["my_schedule"] });
    },
  });

  return {
    mySubstitutions: mySubstitutions.data ?? [],
    companySubstitutions: companySubstitutions.data ?? [],
    loading: mySubstitutions.isLoading,
    requestSubstitution,
    respondSubstitution,
  };
};
