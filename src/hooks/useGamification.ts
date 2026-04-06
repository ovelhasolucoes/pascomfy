import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export const useGamification = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const companyId = profile?.company_id;

  const settings = useQuery({
    queryKey: ["company_settings", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return (data?.settings as Record<string, any>) ?? {};
    },
    enabled: !!companyId,
  });

  const isActive = settings.data?.gamificacao_ativa === true;

  const myPoints = useQuery({
    queryKey: ["my_points", user?.id, companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_points")
        .select("points")
        .eq("user_id", user!.id)
        .eq("company_id", companyId!);
      if (error) throw error;
      return (data ?? []).reduce((sum, r) => sum + r.points, 0);
    },
    enabled: !!user && !!companyId && isActive,
  });

  const levels = useQuery({
    queryKey: ["gamification_levels", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_levels")
        .select("*")
        .eq("company_id", companyId!)
        .order("min_points", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && isActive,
  });

  const ranking = useQuery({
    queryKey: ["gamification_ranking", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamification_points")
        .select("user_id, points, profiles!gamification_points_user_id_fkey(name, avatar_url)")
        .eq("company_id", companyId!);
      if (error) throw error;

      // Aggregate by user
      const map = new Map<string, { name: string; avatar_url: string | null; total: number }>();
      (data ?? []).forEach((r: any) => {
        const existing = map.get(r.user_id);
        if (existing) {
          existing.total += r.points;
        } else {
          map.set(r.user_id, {
            name: r.profiles?.name ?? "?",
            avatar_url: r.profiles?.avatar_url,
            total: r.points,
          });
        }
      });

      return Array.from(map.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
    enabled: !!companyId && isActive,
  });

  const currentLevel = (() => {
    if (!levels.data || !myPoints.data) return null;
    const sorted = [...levels.data].sort((a, b) => b.min_points - a.min_points);
    return sorted.find((l) => (myPoints.data ?? 0) >= l.min_points) ?? null;
  })();

  return {
    isActive,
    myPoints: myPoints.data ?? 0,
    currentLevel,
    levels: levels.data ?? [],
    ranking: ranking.data ?? [],
    loading: settings.isLoading,
  };
};
