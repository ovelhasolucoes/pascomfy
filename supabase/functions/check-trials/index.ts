import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find expired trials
    const { data: expiredSubs, error } = await supabase
      .from("subscriptions")
      .select("id, company_id, trial_until")
      .eq("status", "trial")
      .lt("trial_until", new Date().toISOString())
      .not("trial_until", "is", null);

    if (error) throw error;

    for (const sub of expiredSubs || []) {
      // Update subscription status to atrasado
      await supabase
        .from("subscriptions")
        .update({ status: "atrasado" } as any)
        .eq("id", sub.id);

      // Get admin of the company for notification
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins) {
        for (const admin of admins) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", admin.user_id)
            .eq("company_id", sub.company_id)
            .maybeSingle();

          if (profile) {
            await supabase.from("notifications").insert({
              company_id: sub.company_id,
              user_id: admin.user_id,
              title: "Trial expirado",
              message: "O período de trial da sua empresa expirou. Entre em contato para ativar sua assinatura.",
              type: "sistema",
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ processed: (expiredSubs || []).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Check trials error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
