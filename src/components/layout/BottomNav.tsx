import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, CalendarDays, User, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "events", label: "Eventos", icon: Calendar, path: "/events" },
  { id: "schedule", label: "Agenda", icon: CalendarDays, path: "/my-schedule" },
  { id: "profile", label: "Perfil", icon: User, path: "/profile" },
  { id: "more", label: "Mais", icon: MoreHorizontal, path: "__more__" },
] as const;

interface BottomNavProps {
  onMorePress: () => void;
}

export function BottomNav({ onMorePress }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "__more__") {
      return ["/admin", "/social", "/superadmin"].some((p) =>
        location.pathname.startsWith(p)
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.path === "__more__") {
                  onMorePress();
                } else {
                  navigate(tab.path);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95 relative",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
              <tab.icon className={cn("h-5 w-5 transition-all", active && "scale-105")} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
