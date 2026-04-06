import { useNavigate } from "react-router-dom";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Calendar, Users, AlertTriangle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  escala: { label: "Escala", icon: Users, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  evento: { label: "Evento", icon: Calendar, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  aviso: { label: "Aviso", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  sistema: { label: "Sistema", icon: Info, color: "bg-muted text-muted-foreground" },
};

function getNotificationEventId(notification: Notification): string | null {
  const meta = notification.metadata as Record<string, unknown> | null;
  if (!meta) return null;
  return (meta.event_id as string) || null;
}

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Notification;
  onNavigate: (notification: Notification) => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.sistema;
  const Icon = config.icon;
  const eventId = getNotificationEventId(notification);

  return (
    <button
      onClick={() => onNavigate(notification)}
      className={`w-full text-left px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors ${
        !notification.read ? "bg-accent/20" : ""
      } ${eventId ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm truncate">{notification.title}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${config.color}`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
        )}
      </div>
    </button>
  );
}

interface NotificationPanelProps {
  onClose?: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNavigate = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to event if event_id exists
    const eventId = getNotificationEventId(notification);
    if (eventId) {
      onClose?.();
      navigate(`/events/${eventId}`);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Notificações</h3>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllAsRead()}>
            <CheckCheck className="h-3 w-3 mr-1" />
            Marcar todas
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-[400px]">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onNavigate={handleNavigate} />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
