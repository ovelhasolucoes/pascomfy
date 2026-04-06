import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type EventWithType = Tables<"events"> & {
  event_types: Tables<"event_types"> | null;
};

export const useEvents = (filters?: { month?: number; year?: number; typeId?: string; status?: string }) => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events", profile?.company_id, filters],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, event_types(*)")
        .order("start_date", { ascending: true });

      if (filters?.status) {
        query = query.eq("status", filters.status as "ativo" | "cancelado");
      }

      if (filters?.typeId) {
        query = query.eq("event_type_id", filters.typeId);
      }

      if (filters?.month !== undefined && filters?.year !== undefined) {
        const startOfMonth = new Date(filters.year, filters.month, 1).toISOString();
        const endOfMonth = new Date(filters.year, filters.month + 1, 0, 23, 59, 59).toISOString();
        query = query.gte("start_date", startOfMonth).lte("start_date", endOfMonth);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EventWithType[];
    },
    enabled: !!profile?.company_id,
  });

  const createEvent = useMutation({
    mutationFn: async (event: Omit<TablesInsert<"events">, "company_id" | "created_by">) => {
      if (!profile) throw new Error("No profile");
      const { data, error } = await supabase
        .from("events")
        .insert({ ...event, company_id: profile.company_id, created_by: profile.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<"events">>) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return { events: eventsQuery.data ?? [], loading: eventsQuery.isLoading, createEvent, updateEvent, deleteEvent };
};
