import { Calendar, CalendarDays, Users, Settings, LogOut, UserCircle, LayoutDashboard, Building2, CreditCard, Receipt, Link2, MessageSquare, ScrollText, Bell, Share2, FileText, CalendarCheck, UserCog } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { signOut } = useAuth();
  const { profile } = useProfile();

  const mainItems = [
    { title: "Eventos", url: "/events", icon: Calendar },
    { title: "Minha Agenda", url: "/my-schedule", icon: CalendarDays },
  ];

  const adminItems = [
    { title: "Usuários", url: "/admin/users", icon: Users },
    { title: "Notificações", url: "/admin/notifications", icon: Bell },
    { title: "Biolink", url: "/admin/biolink", icon: Link2 },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
  ];

  const socialItems = [
    { title: "Posts", url: "/social/posts", icon: FileText },
    { title: "Calendário", url: "/social/calendar", icon: CalendarCheck },
    { title: "Contas", url: "/social/accounts", icon: UserCog },
  ];

  const superAdminItems = [
    { title: "Dashboard", url: "/superadmin", icon: LayoutDashboard },
    { title: "Companies", url: "/superadmin/companies", icon: Building2 },
    { title: "Planos", url: "/superadmin/plans", icon: CreditCard },
    { title: "Assinaturas", url: "/superadmin/subscriptions", icon: Receipt },
    { title: "Afiliados", url: "/superadmin/affiliates", icon: Link2 },
    { title: "Tickets", url: "/superadmin/tickets", icon: MessageSquare },
    { title: "Logs", url: "/superadmin/logs", icon: ScrollText },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{collapsed ? "P" : "Pascomfy"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{collapsed ? "A" : "Admin"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{collapsed ? "S" : "Social"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {socialItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{collapsed ? "SA" : "Super Admin"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <UserCircle className="h-5 w-5 text-sidebar-foreground" />
          {!collapsed && (
            <span className="text-sm text-sidebar-foreground truncate">{profile?.name}</span>
          )}
        </div>
        <Button variant="ghost" size={collapsed ? "icon" : "sm"} onClick={signOut} className="w-full justify-start text-sidebar-foreground">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
