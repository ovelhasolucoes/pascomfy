import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_BASE_URL = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check super_admin or admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["super_admin", "admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "MERCADOPAGO_ACCESS_TOKEN not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_preference") {
      // Creates a checkout preference (payment link)
      const { subscription_id, company_id, amount, description, plan_name } = body;

      const mpRes = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: plan_name || "Assinatura Pascomfy",
              quantity: 1,
              unit_price: Number(amount),
              currency_id: "BRL",
            },
          ],
          back_urls: {
            success: body.success_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?type=success`,
            failure: body.failure_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?type=failure`,
            pending: body.pending_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook?type=pending`,
          },
          external_reference: subscription_id,
          notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
          auto_return: "approved",
        }),
      });

      const preference = await mpRes.json();
      if (!mpRes.ok) {
        return new Response(JSON.stringify({ error: "MP error", details: preference }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Insert pending payment
      await adminClient.from("payments").insert({
        company_id,
        subscription_id,
        amount,
        status: "pendente",
        gateway: "mercadopago",
        external_id: preference.id,
      } as any);

      return new Response(JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "create_subscription") {
      const { subscription_id, amount, plan_name, payer_email } = body;

      const mpRes = await fetch(`${MP_BASE_URL}/preapproval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          reason: plan_name || "Assinatura Pascomfy",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: Number(amount),
            currency_id: "BRL",
          },
          payer_email,
          back_url: body.back_url || "",
          external_reference: subscription_id,
        }),
      });

      const sub = await mpRes.json();
      if (!mpRes.ok) {
        return new Response(JSON.stringify({ error: "MP error", details: sub }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await adminClient
        .from("subscriptions")
        .update({ gateway: "mercadopago", external_id: sub.id, status: "ativo" } as any)
        .eq("id", subscription_id);

      return new Response(JSON.stringify({
        mp_subscription_id: sub.id,
        init_point: sub.init_point,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
