import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface CompanyTheme {
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  theme: string;
  isWhitelabel: boolean;
  allowsCustomDomain: boolean;
  customDomain: string | null;
  domainVerified: boolean;
  loading: boolean;
}

const defaultTheme: CompanyTheme = {
  companyName: "Pascomfy",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  theme: "light",
  isWhitelabel: false,
  allowsCustomDomain: false,
  customDomain: null,
  domainVerified: false,
  loading: true,
};

const CompanyThemeContext = createContext<CompanyTheme>(defaultTheme);

export const useCompanyTheme = () => useContext(CompanyThemeContext);

const DEFAULT_HOSTS = ["localhost", "lovable.app", "pascomfy.com", "pascomfy.app"];

function isDefaultHost(hostname: string) {
  return DEFAULT_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

export function CompanyThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isCustomHost = hostname && !isDefaultHost(hostname);

  // Resolve company by custom domain (anon, for custom domains)
  const { data: domainCompany } = useQuery({
    queryKey: ["company-by-domain", hostname],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, logo_url, primary_color, secondary_color, theme, favicon_url, custom_domain, domain_verified")
        .eq("custom_domain", hostname)
        .eq("domain_verified", true)
        .maybeSingle();
      return data;
    },
    enabled: isCustomHost,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch company by user's company_id (authenticated)
  const companyId = domainCompany?.id || profile?.company_id;

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-theme", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*, subscriptions(plan_id, plans(allows_whitelabel, allows_custom_domain))")
        .eq("id", companyId!)
        .single();
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Extract plan permissions
  const plan = (company as any)?.subscriptions?.plans;
  const allowsWhitelabel = plan?.allows_whitelabel ?? false;
  const allowsCustomDomain = plan?.allows_custom_domain ?? false;

  // Apply theme
  useEffect(() => {
    if (!company) return;

    const root = document.documentElement;

    if (allowsWhitelabel) {
      root.style.setProperty("--company-primary", company.primary_color || "#6366f1");
      root.style.setProperty("--company-secondary", company.secondary_color || "#8b5cf6");

      if (company.theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    // Favicon
    if (allowsWhitelabel && company.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = company.favicon_url;
    }
  }, [company, allowsWhitelabel]);

  const value = useMemo<CompanyTheme>(
    () => ({
      companyName: company?.name || "Pascomfy",
      logoUrl: company?.logo_url || null,
      faviconUrl: company?.favicon_url || null,
      primaryColor: company?.primary_color || "#6366f1",
      secondaryColor: company?.secondary_color || "#8b5cf6",
      theme: company?.theme || "light",
      isWhitelabel: allowsWhitelabel,
      allowsCustomDomain,
      customDomain: company?.custom_domain || null,
      domainVerified: company?.domain_verified || false,
      loading: isLoading,
    }),
    [company, allowsWhitelabel, allowsCustomDomain, isLoading]
  );

  return (
    <CompanyThemeContext.Provider value={value}>
      {children}
    </CompanyThemeContext.Provider>
  );
}
