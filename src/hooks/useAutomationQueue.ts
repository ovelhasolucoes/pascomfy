import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "@/hooks/use-toast";

interface DispatchParams {
  userIds: string[];
  channel: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export function useAutomationQueue() {
  const { profile } = useProfile();

  const dispatch = useMutation({
    mutationFn: async ({ userIds, channel, title, message, metadata }: DispatchParams) => {
      const companyId = profile!.company_id!;
      const rows = userIds.map((uid) => ({
        company_id: companyId,
        user_id: uid,
        channel,
        title,
        message,
        metadata: metadata || {},
      }));
      const { error } = await supabase.from("automation_queue").insert(rows as never);
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Mensagens enfileiradas para envio!" }),
    onError: (e: Error) => toast({ title: "Erro ao enfileirar", description: e.message, variant: "destructive" }),
  });

  const buildGroupMessage = async (eventId: string) => {
    const { data: event } = await supabase.from("events").select("title, start_date").eq("id", eventId).single();
    if (!event) return "";

    const { data: teams } = await supabase
      .from("event_teams")
      .select("id, name, event_team_members(user_id, role_name, profiles:user_id(name))")
      .eq("event_id", eventId)
      .order("display_order");

    const date = new Date(event.start_date);
    const dateStr = date.toLocaleDateString("pt-BR");
    const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let msg = `📋 *${event.title}*\n📅 ${dateStr} às ${timeStr}\n`;

    for (const team of teams || []) {
      const members = (team.event_team_members || []) as Array<{
        user_id: string;
        role_name: string | null;
        profiles: { name: string } | null;
      }>;
      if (members.length === 0) continue;
      msg += `\n🏷️ *${team.name}:*\n`;
      for (const m of members) {
        const name = m.profiles?.name || "—";
        const role = m.role_name ? ` (${m.role_name})` : "";
        msg += `  • ${name}${role}\n`;
      }
    }

    return msg.trim();
  };

  return {
    dispatch: dispatch.mutate,
    isDispatching: dispatch.isPending,
    buildGroupMessage,
  };
}
