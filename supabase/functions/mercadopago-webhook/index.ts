import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const MP_BASE_URL = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "GET") {
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
        await supabase.from("payments").update({ status: "pago", paid_at: new Date().toISOString(), external_id: String(data.id) }).eq("id", dbPayment.id);
        await supabase.from("subscriptions").update({ status: "ativo" }).eq("id", dbPayment.subscription_id);
        await supabase.from("companies").update({ status: "ativa" }).eq("id", dbPayment.company_id);

        // Affiliate conversion
        await processAffiliateConversion(supabase, dbPayment.company_id);
      }
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "falhou", external_id: String(data.id) }).eq("id", dbPayment.id);
      }
    } else if (payment.status === "refunded") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "estornado", external_id: String(data.id) }).eq("id", dbPayment.id);
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

async function processAffiliateConversion(supabase: any, companyId: string) {
  try {
    const { data: referral } = await supabase
      .from("affiliate_referrals")
      .select("id, affiliate_id, status")
      .eq("referred_company_id", companyId)
      .eq("status", "pendente")
      .maybeSingle();

    if (!referral) return;

    await supabase.from("affiliate_referrals")
      .update({ status: "convertido", reward_applied: true })
      .eq("id", referral.id);

    const { data: program } = await supabase
      .from("affiliate_program")
      .select("company_id, reward_type, reward_value")
      .eq("id", referral.affiliate_id)
      .single();

    if (!program) return;

    await supabase.from("affiliate_rewards").insert({
      affiliate_company_id: program.company_id,
      referral_id: referral.id,
      reward_type: program.reward_type,
      reward_value: program.reward_value,
      applied: false,
    });

    if (program.reward_type === "dias_gratis") {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, ends_at")
        .eq("company_id", program.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub) {
        const baseDate = sub.ends_at ? new Date(sub.ends_at) : new Date();
        baseDate.setDate(baseDate.getDate() + Number(program.reward_value));
        await supabase.from("subscriptions")
          .update({ ends_at: baseDate.toISOString() })
          .eq("id", sub.id);
      }

      await supabase.from("affiliate_rewards")
        .update({ applied: true, applied_at: new Date().toISOString() })
        .eq("referral_id", referral.id)
        .eq("affiliate_company_id", program.company_id);
    }
  } catch (err) {
    console.error("Affiliate conversion error:", err);
  }
}
