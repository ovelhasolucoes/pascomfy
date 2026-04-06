import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Check super_admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), { status: 500, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_customer") {
      const { company_id, name, email, cpfCnpj } = body;
      const asaasRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify({ name, email, cpfCnpj }),
      });
      const customer = await asaasRes.json();
      if (!asaasRes.ok) {
        return new Response(JSON.stringify({ error: "Asaas error", details: customer }), { status: 400, headers: corsHeaders });
      }

      // Save customer ID on subscription
      const { error: updateErr } = await adminClient
        .from("subscriptions")
        .update({ asaas_customer_id: customer.id, gateway: "asaas" } as any)
        .eq("company_id", company_id)
        .order("created_at", { ascending: false })
        .limit(1);

      return new Response(JSON.stringify({ customer_id: customer.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "create_charge") {
      const { subscription_id, asaas_customer_id, amount, billing_type, description } = body;

      const asaasRes = await fetch(`${ASAAS_BASE_URL}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify({
          customer: asaas_customer_id,
          billingType: billing_type || "PIX",
          value: amount,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          description: description || "Assinatura Pascomfy",
        }),
      });
      const payment = await asaasRes.json();
      if (!asaasRes.ok) {
        return new Response(JSON.stringify({ error: "Asaas error", details: payment }), { status: 400, headers: corsHeaders });
      }

      // Get company_id from subscription
      const { data: sub } = await adminClient.from("subscriptions").select("company_id").eq("id", subscription_id).single();

      await adminClient.from("payments").insert({
        company_id: sub!.company_id,
        subscription_id,
        amount,
        status: "pendente",
        gateway: "asaas",
        external_id: payment.id,
      } as any);

      return new Response(JSON.stringify({ payment_id: payment.id, invoice_url: payment.invoiceUrl, pix_code: payment.pixQrCodeUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "create_subscription") {
      const { subscription_id, asaas_customer_id, amount, billing_type, cycle } = body;

      const asaasRes = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify({
          customer: asaas_customer_id,
          billingType: billing_type || "PIX",
          value: amount,
          cycle: cycle || "MONTHLY",
          nextDueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          description: "Assinatura Pascomfy",
        }),
      });
      const sub = await asaasRes.json();
      if (!asaasRes.ok) {
        return new Response(JSON.stringify({ error: "Asaas error", details: sub }), { status: 400, headers: corsHeaders });
      }

      await adminClient
        .from("subscriptions")
        .update({ asaas_subscription_id: sub.id, gateway: "asaas", status: "ativo" } as any)
        .eq("id", subscription_id);

      return new Response(JSON.stringify({ asaas_subscription_id: sub.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
