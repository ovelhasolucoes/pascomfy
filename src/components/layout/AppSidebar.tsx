import {
  Calendar, CalendarDays, Users, Settings, LogOut, LayoutDashboard,
  Building2, CreditCard, Receipt, Link2, MessageSquare, ScrollText,
  Bell, Share2, FileText, CalendarCheck, UserCog, ChevronRight,
  Gift, Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type MenuItem = { title: string; url: string; icon: React.ElementType };

function MenuGroup({
  label,
  items,
  collapsed,
  icon,
  defaultOpen,
}: {
  label: string;
  items: MenuItem[];
  collapsed: boolean;
  icon: React.ElementType;
  defaultOpen?: boolean;
}) {
  const location = useLocation();
  const isActive = items.some((i) => location.pathname.startsWith(i.url));
  const Icon = icon;

  if (collapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink
                    to={item.url}
                    className="hover:bg-sidebar-accent"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    <item.icon className="h-4 w-4" />
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen ?? isActive} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors">
            <Icon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            {label}
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const mainItems: MenuItem[] = [
    { title: "Eventos", url: "/events", icon: Calendar },
    { title: "Minha Agenda", url: "/my-schedule", icon: CalendarDays },
  ];

  const adminItems: MenuItem[] = [
    { title: "Usuários", url: "/admin/users", icon: Users },
    { title: "Notificações", url: "/admin/notifications", icon: Bell },
    { title: "Biolink", url: "/admin/biolink", icon: Link2 },
    { title: "Indicações", url: "/admin/referrals", icon: Gift },
    { title: "Assinatura", url: "/admin/my-subscription", icon: CreditCard },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
  ];

  const socialItems: MenuItem[] = [
    { title: "Posts", url: "/social/posts", icon: FileText },
    { title: "Calendário", url: "/social/calendar", icon: CalendarCheck },
    { title: "Contas", url: "/social/accounts", icon: UserCog },
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
  ];

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
            P
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground tracking-tight">
              Pascomfy
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <MenuGroup label="Principal" items={mainItems} collapsed={collapsed} icon={Calendar} defaultOpen />

        {isAdmin && (
          <>
            <SidebarSeparator />
            <MenuGroup label="Social" items={socialItems} collapsed={collapsed} icon={Share2} />
          </>
        )}

        {isAdmin && (
          <>
            <SidebarSeparator />
            <MenuGroup label="Administração" items={adminItems} collapsed={collapsed} icon={Settings} />
          </>
        )}

        {isSuperAdmin && (
          <>
            <SidebarSeparator />
            <MenuGroup label="Super Admin" items={superAdminItems} collapsed={collapsed} icon={Shield} />
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          )}
          <button
            onClick={signOut}
            title="Sair"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
