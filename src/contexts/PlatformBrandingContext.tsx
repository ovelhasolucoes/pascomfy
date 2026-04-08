import { createContext, useContext, useEffect, ReactNode } from "react";
import { usePlatformBranding, type PlatformBranding, type PlatformLogin, type PlatformAnnouncement } from "@/hooks/usePlatformBranding";

interface PlatformBrandingContextValue {
  branding: PlatformBranding;
  login: PlatformLogin;
  announcements: PlatformAnnouncement[];
  isLoading: boolean;
}

const PlatformBrandingContext = createContext<PlatformBrandingContextValue>({
  branding: {
    app_name: "Pascomfy",
    logo_url: null,
    favicon_url: null,
    primary_color: "#c4a983",
    secondary_color: "#8b7355",
  },
  login: {
    background_url: null,
    welcome_title: "Bem-vindo de volta",
    welcome_subtitle: "",
    auth_methods: { email: true, google: false },
  },
  announcements: [],
  isLoading: true,
});

export const usePlatformBrandingContext = () => useContext(PlatformBrandingContext);

export function PlatformBrandingProvider({ children }: { children: ReactNode }) {
  const { branding, login, announcements, isLoading } = usePlatformBranding();

  // Apply favicon
  useEffect(() => {
    if (branding.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.favicon_url;
    }
  }, [branding.favicon_url]);

  // Apply document title
  useEffect(() => {
    if (branding.app_name) {
      document.title = branding.app_name;
    }
  }, [branding.app_name]);

  return (
    <PlatformBrandingContext.Provider value={{ branding, login, announcements, isLoading }}>
      {children}
    </PlatformBrandingContext.Provider>
  );
}
