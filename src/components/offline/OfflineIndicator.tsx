import { Wifi, WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, doSync } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg border transition-all md:bottom-4",
        isOnline
          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
          : "bg-destructive/10 border-destructive/30 text-destructive"
      )}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}

      <span className="text-sm font-medium">
        {!isOnline ? "Offline" : ""}
      </span>

      {pendingCount > 0 && (
        <Badge variant="secondary" className="text-xs gap-1">
          <CloudOff className="h-3 w-3" />
          {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
        </Badge>
      )}

      {isOnline && pendingCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={doSync}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}
