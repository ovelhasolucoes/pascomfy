import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PlanAction = "add_user" | "upload_file" | "create_event" | "custom_domain" | "whitelabel";

interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  current?: number;
  limit?: number;
}

export async function checkPlanLimit(action: PlanAction): Promise<PlanCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke("validate-plan-limits", {
      body: { action },
    });

    if (error) {
      console.error("Plan check error:", error);
      return { allowed: true }; // fail open for UX, backend triggers will catch
    }

    if (!data.allowed) {
      toast.error(data.reason || "Limite do plano atingido");
    }

    return data as PlanCheckResult;
  } catch {
    return { allowed: true };
  }
}
