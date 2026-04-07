import { useState, useEffect, useCallback } from "react";
import { syncPendingActions } from "@/services/offline/SyncService";
import { getPendingActions } from "@/services/offline/OfflineQueue";
import { toast } from "sonner";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const actions = await getPendingActions();
    setPendingCount(actions.length);
  }, []);

  const doSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const { synced, failed } = await syncPendingActions();
      if (synced > 0) {
        toast.success(`${synced} ação(ões) sincronizada(s) com sucesso!`);
      }
      if (failed > 0) {
        toast.error(`${failed} ação(ões) falharam ao sincronizar.`);
      }
      await refreshPendingCount();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão restaurada! Sincronizando...");
      doSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sem conexão. Suas ações serão salvas localmente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshPendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [doSync, refreshPendingCount]);

  return { isOnline, pendingCount, isSyncing, doSync, refreshPendingCount };
}
