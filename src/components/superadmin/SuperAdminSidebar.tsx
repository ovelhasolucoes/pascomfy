import {
  LayoutDashboard, Building2, Users, CreditCard, Receipt,
  Gift, MessageSquare, ScrollText, Settings, Globe, Plug, LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformBrandingContext } from "@/contexts/PlatformBrandingContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type MenuItem = { title: string; url: string; icon: React.ElementType; badge?: number };

function MenuSection({ label, items, collapsed }: { label: string; items: MenuItem[]; collapsed: boolean }) {
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                <NavLink
                  to={item.url}
                  end={item.url === "/superadmin"}
                  className="hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-[20px] px-1.5">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function SuperAdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { branding } = usePlatformBrandingContext();

  const overviewItems: MenuItem[] = [
    { title: "Dashboard", url: "/superadmin", icon: LayoutDashboard },
  ];

  const managementItems: MenuItem[] = [
    { title: "Empresas", url: "/superadmin/companies", icon: Building2 },
    { title: "Usuários SA", url: "/superadmin/users", icon: Users },
    { title: "Planos", url: "/superadmin/plans", icon: CreditCard },
  ];

  const financialItems: MenuItem[] = [
    { title: "Assinaturas", url: "/superadmin/subscriptions", icon: Receipt },
    { title: "Pagamentos", url: "/superadmin/payments", icon: Receipt },
    { title: "Afiliados", url: "/superadmin/affiliates", icon: Gift },
  ];

  const supportItems: MenuItem[] = [
    { title: "Tickets", url: "/superadmin/tickets", icon: MessageSquare },
    { title: "Domínios", url: "/superadmin/domains", icon: Globe },
    { title: "Integrações", url: "/superadmin/integrations", icon: Plug },
  ];

  const systemItems: MenuItem[] = [
    { title: "Logs", url: "/superadmin/logs", icon: ScrollText },
    { title: "Configurações", url: "/superadmin/settings", icon: Settings },
  ];

  const displayName = branding.app_name || "Pascomfy";
  const displayLogo = branding.logo_url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          {displayLogo ? (
            <img src={displayLogo} alt={displayName} className="h-8 w-8 rounded-xl object-contain shrink-0" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shrink-0">
              {displayName.charAt(0)}
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-semibold text-sidebar-foreground tracking-tight truncate">
                {displayName}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                Super Admin
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <MenuSection label="Visão Geral" items={overviewItems} collapsed={collapsed} />
        <SidebarSeparator />
        <MenuSection label="Gestão" items={managementItems} collapsed={collapsed} />
        <SidebarSeparator />
        <MenuSection label="Financeiro" items={financialItems} collapsed={collapsed} />
        <SidebarSeparator />
        <MenuSection label="Suporte" items={supportItems} collapsed={collapsed} />
        <SidebarSeparator />
        <MenuSection label="Sistema" items={systemItems} collapsed={collapsed} />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 text-destructive shrink-0" />
          {!collapsed && <span className="text-sm font-medium text-destructive">Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
