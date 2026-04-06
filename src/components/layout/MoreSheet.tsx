import { useNavigate } from "react-router-dom";
import {
  Users, Settings, Bell, Link2, Gift, CreditCard, RefreshCw,
  FileText, CalendarCheck, UserCog, LayoutDashboard, Building2,
  Receipt, MessageSquare, ScrollText, Shield, Share2, LogOut
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
};

function NavSection({ title, items, onNavigate }: { title: string; items: NavItem[]; onNavigate: (url: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">{title}</p>
      {items.map((item) => (
        <button
          key={item.url}
          onClick={() => onNavigate(item.url)}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/80">
            <item.icon className="h-4.5 w-4.5 text-foreground" />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground text-left">{item.title}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px] px-1.5">
              {item.badge > 99 ? "99+" : item.badge}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { signOut } = useAuth();
  const { unreadCount } = useNotifications();

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  const socialItems: NavItem[] = [
    { title: "Posts", url: "/social/posts", icon: FileText },
    { title: "Calendário Social", url: "/social/calendar", icon: CalendarCheck },
    { title: "Contas Sociais", url: "/social/accounts", icon: UserCog },
  ];

  const adminItems: NavItem[] = [
    { title: "Usuários", url: "/admin/users", icon: Users },
    { title: "Substituições", url: "/admin/substitutions", icon: RefreshCw },
    { title: "Notificações", url: "/admin/notifications", icon: Bell, badge: unreadCount },
    { title: "Biolink", url: "/admin/biolink", icon: Link2 },
    { title: "Indicações", url: "/admin/referrals", icon: Gift },
    { title: "Assinatura", url: "/admin/my-subscription", icon: CreditCard },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
  ];

  const superAdminItems: NavItem[] = [
    { title: "Dashboard", url: "/superadmin", icon: LayoutDashboard },
    { title: "Empresas", url: "/superadmin/companies", icon: Building2 },
    { title: "Planos", url: "/superadmin/plans", icon: CreditCard },
    { title: "Assinaturas", url: "/superadmin/subscriptions", icon: Receipt },
    { title: "Pagamentos", url: "/superadmin/payments", icon: Receipt },
    { title: "Afiliados", url: "/superadmin/affiliates", icon: Gift },
    { title: "Tickets", url: "/superadmin/tickets", icon: MessageSquare },
    { title: "Logs", url: "/superadmin/logs", icon: ScrollText },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8 space-y-5">
          {isAdmin && (
            <NavSection title="Social" items={socialItems} onNavigate={handleNavigate} />
          )}

          {isAdmin && (
            <NavSection title="Administração" items={adminItems} onNavigate={handleNavigate} />
          )}

          {isSuperAdmin && (
            <NavSection title="Super Admin" items={superAdminItems} onNavigate={handleNavigate} />
          )}

          <div className="pt-2 border-t border-border">
            <button
              onClick={() => { onOpenChange(false); signOut(); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-destructive/10">
                <LogOut className="h-4.5 w-4.5 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">Sair</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
