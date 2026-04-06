import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSupportTickets = () => {
  const queryClient = useQueryClient();

  const tickets = useQuery({
    queryKey: ["superadmin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, companies(name), profiles(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("support_tickets").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["superadmin-tickets"] }),
  });

  return { ...tickets, updateTicketStatus };
};

export const useTicketMessages = (ticketId: string | null) => {
  const queryClient = useQueryClient();

  const messages = useQuery({
    queryKey: ["ticket-messages", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*, profiles(name)")
        .eq("ticket_id", ticketId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ message, userId }: { message: string; userId: string }) => {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: ticketId!,
        user_id: userId,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] }),
  });

  return { ...messages, sendMessage };
};
