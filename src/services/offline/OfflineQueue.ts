import { get, set, del, keys } from "idb-keyval";

export interface QueuedAction {
  id: string;
  type: "checkin" | "attendance" | "checklist_progress" | "confirm_presence";
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

const QUEUE_PREFIX = "offline_action_";

export async function enqueueAction(action: Omit<QueuedAction, "id" | "createdAt" | "retries">) {
  const id = crypto.randomUUID();
  const entry: QueuedAction = {
    ...action,
    id,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  await set(`${QUEUE_PREFIX}${id}`, entry);
  return entry;
}

export async function getPendingActions(): Promise<QueuedAction[]> {
  const allKeys = await keys();
  const queueKeys = allKeys.filter((k) => String(k).startsWith(QUEUE_PREFIX));
  const items: QueuedAction[] = [];
  for (const k of queueKeys) {
    const val = await get<QueuedAction>(k);
    if (val) items.push(val);
  }
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeAction(id: string) {
  await del(`${QUEUE_PREFIX}${id}`);
}

export async function updateActionRetries(id: string, retries: number) {
  const action = await get<QueuedAction>(`${QUEUE_PREFIX}${id}`);
  if (action) {
    await set(`${QUEUE_PREFIX}${id}`, { ...action, retries });
  }
}
