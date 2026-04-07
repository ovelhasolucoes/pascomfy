import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  category: string;
  updated_at: string;
}

export function usePlatformSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings" as never)
        .select("*");
      if (error) throw error;
      return (data as unknown as PlatformSetting[]) ?? [];
    },
  });

  const getSetting = (key: string) =>
    settings?.find((s) => s.key === key)?.value ?? {};

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("platform_settings" as never)
        .update({ value, updated_at: new Date().toISOString() } as never)
        .eq("key" as never, key as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Configuração salva!");
    },
    onError: () => {
      toast.error("Erro ao salvar configuração.");
    },
  });

  return { settings, isLoading, getSetting, updateSetting };
}
