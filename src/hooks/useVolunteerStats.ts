import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export const useVolunteerStats = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const companyId = profile?.company_id;

  const attendance = useQuery({
    queryKey: ["volunteer_attendance", user?.id, companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendance")
        .select("id, status, checkin_at, events!event_attendance_event_id_fkey(title, start_date)")
        .eq("user_id", user!.id)
        .eq("company_id", companyId!)
        .order("checkin_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!companyId,
  });

  const records = attendance.data ?? [];
  const totalPresent = records.filter((r) => r.status === "presente").length;
  const totalAbsent = records.filter((r) => r.status === "ausente").length;
  const total = totalPresent + totalAbsent;
  const attendanceRate = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

  // Count events the user has been scheduled to (all time)
  const scheduledCount = useQuery({
    queryKey: ["volunteer_scheduled_count", user?.id, companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_team_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("company_id", companyId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user && !!companyId,
  });

  return {
    totalPresent,
    totalAbsent,
    attendanceRate,
    recentAttendance: records.slice(0, 10),
    scheduledCount: scheduledCount.data ?? 0,
    loading: attendance.isLoading,
  };
};
