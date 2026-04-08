import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    
    // SECURITY: Token validation is now MANDATORY
    if (!webhookToken) {
      console.error("ASAAS_WEBHOOK_TOKEN not configured — rejecting request");
      return new Response("Server misconfigured", { status: 500 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("asaas-access-token");

    if (token !== webhookToken) {
      console.warn("Asaas webhook: invalid token attempt");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { event, payment } = body;

    if (!event || !payment || typeof payment.id !== "string") {
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
        await supabase.from("payments").update({ status: "pago", paid_at: new Date().toISOString() }).eq("id", dbPayment.id);
        await supabase.from("subscriptions").update({ status: "ativo" }).eq("id", dbPayment.subscription_id);
        await supabase.from("companies").update({ status: "ativa" }).eq("id", dbPayment.company_id);

        // Affiliate conversion
        await processAffiliateConversion(supabase, dbPayment.company_id);
      }
    } else if (event === "PAYMENT_OVERDUE") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "falhou" }).eq("id", dbPayment.id);
        await supabase.from("subscriptions").update({ status: "atrasado" }).eq("id", dbPayment.subscription_id);
      }
    } else if (event === "PAYMENT_REFUNDED") {
      if (dbPayment) {
        await supabase.from("payments").update({ status: "estornado" }).eq("id", dbPayment.id);
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
