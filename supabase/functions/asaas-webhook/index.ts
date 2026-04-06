import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("asaas-access-token");

    if (webhookToken && token !== webhookToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { event, payment } = body;

    if (!event || !payment) {
      return new Response("Invalid payload", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find payment by external_id
    const { data: dbPayment } = await supabase
      .from("payments")
      .select("id, subscription_id, company_id")
      .eq("external_id", payment.id)
      .maybeSingle();

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "pago", paid_at: new Date().toISOString() } as any).eq("id", dbPayment.id);
        await supabase.from("subscriptions").update({ status: "ativo" } as any).eq("id", dbPayment.subscription_id);
        await supabase.from("companies").update({ status: "ativa" } as any).eq("id", dbPayment.company_id);
      }
    } else if (event === "PAYMENT_OVERDUE") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "falhou" } as any).eq("id", dbPayment.id);
        await supabase.from("subscriptions").update({ status: "atrasado" } as any).eq("id", dbPayment.subscription_id);
      }
    } else if (event === "PAYMENT_REFUNDED") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "estornado" } as any).eq("id", dbPayment.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
