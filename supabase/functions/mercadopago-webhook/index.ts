import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const MP_BASE_URL = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "GET") {
    // Back URL redirect
    return new Response("OK", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    if (type !== "payment" || !data?.id) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response("Config error", { status: 500 });
    }

    // Fetch payment details from MP
    const mpRes = await fetch(`${MP_BASE_URL}/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    if (!mpRes.ok) {
      console.error("Failed to fetch MP payment:", payment);
      return new Response("MP API error", { status: 500 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const subscriptionId = payment.external_reference;

    // Find payment by external_reference (subscription_id) or external_id
    const { data: dbPayment } = await supabase
      .from("payments")
      .select("id, subscription_id, company_id")
      .eq("gateway", "mercadopago")
      .eq("subscription_id", subscriptionId)
      .eq("status", "pendente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment.status === "approved") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "pago", paid_at: new Date().toISOString(), external_id: String(data.id) } as any).eq("id", dbPayment.id);
        await supabase.from("subscriptions").update({ status: "ativo" } as any).eq("id", dbPayment.subscription_id);
        await supabase.from("companies").update({ status: "ativa" } as any).eq("id", dbPayment.company_id);
      }
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "falhou", external_id: String(data.id) } as any).eq("id", dbPayment.id);
      }
    } else if (payment.status === "refunded") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "estornado", external_id: String(data.id) } as any).eq("id", dbPayment.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("MP Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
