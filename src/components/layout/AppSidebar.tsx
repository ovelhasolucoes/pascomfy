import {
  Calendar, CalendarDays, Users, Settings, LogOut,
  Home, User, Bell, CreditCard, LayoutDashboard,
  Building2, Receipt, MessageSquare, ScrollText, Gift, Share2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCompanyTheme } from "@/contexts/CompanyThemeContext";
import { usePlatformBrandingContext } from "@/contexts/PlatformBrandingContext";

type MenuItem = { title: string; url: string; icon: React.ElementType; badge?: number };

function FlatMenu({ label, items, collapsed }: { label: string; items: MenuItem[]; collapsed: boolean }) {
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                <NavLink
                  to={item.url}
                  className="hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <div className="relative">
                    <item.icon className="h-4 w-4" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { companyName, logoUrl, isWhitelabel } = useCompanyTheme();
  const { branding: platformBranding } = usePlatformBrandingContext();
  const { unreadCount } = useNotifications();

  // Use company branding if whitelabel, otherwise fallback to platform branding
  const displayName = isWhitelabel ? companyName : (platformBranding.app_name || "Pascomfy");
  const displayLogo = isWhitelabel ? logoUrl : platformBranding.logo_url;

  const mainItems: MenuItem[] = [
    { title: "Início", url: "/", icon: Home },
    { title: "Eventos", url: "/events", icon: Calendar },
    { title: "Minha Agenda", url: "/my-schedule", icon: CalendarDays },
    { title: "Social", url: "/social", icon: Share2 },
    { title: "Perfil", url: "/profile", icon: User },
  ];

  const adminItems: MenuItem[] = [
    { title: "Usuários", url: "/admin/users", icon: Users },
    { title: "Notificações", url: "/admin/notifications", icon: Bell, badge: unreadCount },
    { title: "Assinatura", url: "/admin/my-subscription", icon: CreditCard },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
  ];

  const superAdminItems: MenuItem[] = [
    { title: "Dashboard", url: "/superadmin", icon: LayoutDashboard },
    { title: "Empresas", url: "/superadmin/companies", icon: Building2 },
    { title: "Planos", url: "/superadmin/plans", icon: CreditCard },
    { title: "Assinaturas", url: "/superadmin/subscriptions", icon: Receipt },
    { title: "Pagamentos", url: "/superadmin/payments", icon: Receipt },
    { title: "Afiliados", url: "/superadmin/affiliates", icon: Gift },
    { title: "Tickets", url: "/superadmin/tickets", icon: MessageSquare },
    { title: "Logs", url: "/superadmin/logs", icon: ScrollText },
    { title: "Configurações", url: "/superadmin/settings", icon: Settings },
  ];

  const initials = profile?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";

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
            <span className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              {displayName}
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <FlatMenu label="Principal" items={mainItems} collapsed={collapsed} />

        {isAdmin && (
          <>
            <SidebarSeparator />
            <FlatMenu label="Admin" items={adminItems} collapsed={collapsed} />
          </>
        )}

        {isSuperAdmin && (
          <>
            <SidebarSeparator />
            <FlatMenu label="Super Admin" items={superAdminItems} collapsed={collapsed} />
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/50">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.name}</p>
            </div>
          )}
          <button
            onClick={signOut}
            title="Sair"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
