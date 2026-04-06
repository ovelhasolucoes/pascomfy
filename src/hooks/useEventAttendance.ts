import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";

const CHECK_IN_WINDOW_HOURS = 2;

export const useEventAttendance = (eventId?: string, eventStartDate?: string) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["event_attendance", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendance")
        .select("id, user_id, status, checkin_at, profiles!event_attendance_user_id_fkey(name)")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId && !!user,
  });

  const myAttendance = (query.data || []).find((a) => a.user_id === user?.id);

  const isWithinWindow = (() => {
    if (!eventStartDate) return false;
    const start = new Date(eventStartDate);
    const windowStart = new Date(start.getTime() - CHECK_IN_WINDOW_HOURS * 60 * 60 * 1000);
    return new Date() >= windowStart;
  })();

  const hoursUntilWindow = (() => {
    if (!eventStartDate) return 0;
    const start = new Date(eventStartDate);
    const windowStart = new Date(start.getTime() - CHECK_IN_WINDOW_HOURS * 60 * 60 * 1000);
    const diff = windowStart.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
  })();

  const checkIn = useMutation({
    mutationFn: async () => {
      if (!profile || !user) throw new Error("Not authenticated");
      if (!isWithinWindow) throw new Error("Check-in fora da janela permitida");
      if (myAttendance) throw new Error("Já fez check-in");

      const { error } = await supabase
        .from("event_attendance")
        .insert({
          event_id: eventId!,
          user_id: user.id,
          company_id: profile.company_id,
          status: "presente",
          checkin_at: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_attendance", eventId] });
    },
  });

  return {
    attendance: query.data ?? [],
    myAttendance,
    isWithinWindow,
    hoursUntilWindow,
    checkIn,
    loading: query.isLoading,
  };
};
