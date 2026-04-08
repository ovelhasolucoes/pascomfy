import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformBranding {
  app_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export interface PlatformLogin {
  background_url: string | null;
  welcome_title: string;
  welcome_subtitle: string;
  auth_methods: { email: boolean; google: boolean };
}

export interface PlatformAnnouncement {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  active: boolean;
}

const DEFAULT_BRANDING: PlatformBranding = {
  app_name: "Pascomfy",
  logo_url: null,
  favicon_url: null,
  primary_color: "#c4a983",
  secondary_color: "#8b7355",
};

const DEFAULT_LOGIN: PlatformLogin = {
  background_url: null,
  welcome_title: "Bem-vindo de volta",
  welcome_subtitle: "",
  auth_methods: { email: true, google: false },
};

export function usePlatformBranding() {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-branding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings" as never)
        .select("key, value")
        .in("key" as never, ["branding", "login", "announcements"] as never);
      if (error) throw error;
      const map: Record<string, Record<string, unknown>> = {};
      (data as unknown as Array<{ key: string; value: Record<string, unknown> }>)?.forEach(
        (r) => (map[r.key] = r.value)
      );
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const branding: PlatformBranding = {
    ...DEFAULT_BRANDING,
    ...(data?.branding as Partial<PlatformBranding> | undefined),
  };

  const login: PlatformLogin = {
    ...DEFAULT_LOGIN,
    ...(data?.login as Partial<PlatformLogin> | undefined),
    auth_methods: {
      ...DEFAULT_LOGIN.auth_methods,
      ...((data?.login as Record<string, unknown>)?.auth_methods as Partial<PlatformLogin["auth_methods"]> | undefined),
    },
  };

  const announcements: PlatformAnnouncement[] =
    ((data?.announcements as Record<string, unknown>)?.items as PlatformAnnouncement[] | undefined)?.filter(
      (a) => a.active
    ) ?? [];

  return { branding, login, announcements, isLoading };
}
