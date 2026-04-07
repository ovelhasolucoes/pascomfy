import { supabase } from "@/integrations/supabase/client";
import { getPendingActions, removeAction, updateActionRetries, type QueuedAction } from "./OfflineQueue";

async function processAction(action: QueuedAction): Promise<boolean> {
  try {
    switch (action.type) {
      case "checkin": {
        const { event_id, user_id, company_id } = action.payload as {
          event_id: string;
          user_id: string;
          company_id: string;
        };
        const { error } = await supabase.from("event_attendance").upsert(
          { event_id, user_id, company_id, status: "presente", checkin_at: action.createdAt },
          { onConflict: "event_id,user_id" }
        );
        if (error) throw error;
        return true;
      }

      case "attendance": {
        const { event_id, user_id, company_id, status } = action.payload as {
          event_id: string;
          user_id: string;
          company_id: string;
          status: string;
        };
        const { error } = await supabase.from("event_attendance").upsert(
          { event_id, user_id, company_id, status: status as "presente" | "ausente" },
          { onConflict: "event_id,user_id" }
        );
        if (error) throw error;
        return true;
      }

      case "checklist_progress": {
        const { event_checklist_item_id, user_id, company_id, status } = action.payload as {
          event_checklist_item_id: string;
          user_id: string;
          company_id: string;
          status: string;
        };
        const { error } = await supabase.from("event_checklist_progress").upsert(
          {
            event_checklist_item_id,
            user_id,
            company_id,
            status: status as "pendente" | "concluido",
            completed_at: status === "concluido" ? new Date().toISOString() : null,
          },
          { onConflict: "event_checklist_item_id,user_id" }
        );
        if (error) throw error;
        return true;
      }

      case "confirm_presence": {
        const { member_id } = action.payload as { member_id: string };
        const { error } = await supabase
          .from("event_team_members")
          .update({ status: "confirmado", confirmed_at: action.createdAt })
          .eq("id", member_id);
        if (error) throw error;
        return true;
      }

      default:
        console.warn("Unknown offline action type:", action.type);
        return false;
    }
  } catch (err) {
    console.error("Failed to process offline action:", err);
    return false;
  }
}

export async function syncPendingActions(): Promise<{ synced: number; failed: number }> {
  const actions = await getPendingActions();
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    const success = await processAction(action);
    if (success) {
      await removeAction(action.id);
      synced++;
    } else {
      if (action.retries >= 3) {
        await removeAction(action.id);
        failed++;
      } else {
        await updateActionRetries(action.id, action.retries + 1);
        failed++;
      }
    }
  }

  return { synced, failed };
}
