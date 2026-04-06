import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceKey);

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails("mailto:admin@pascomfy.com.br", vapidPublicKey, vapidPrivateKey);
    }

    const body = await req.json().catch(() => ({}));
    const specificId = body.queue_item_id;

    // Fetch pending items (specific or batch)
    let query = supabase
      .from("automation_queue")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: true })
      .limit(50);

    if (specificId) {
      query = supabase
        .from("automation_queue")
        .select("*")
        .eq("id", specificId)
        .in("status", ["pendente", "erro"]);
    }

    const { data: items, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const item of items) {
      if (item.attempts >= 3) {
        await supabase.from("automation_queue").update({ status: "erro", error_message: "Max attempts reached", processed_at: new Date().toISOString() }).eq("id", item.id);
        continue;
      }

      // Mark as processing
      await supabase.from("automation_queue").update({ status: "processando", attempts: item.attempts + 1 }).eq("id", item.id);

      try {
        const channel = item.channel as string;

        if (channel === "in_app") {
          // Insert notification directly
          const { error: notifErr } = await supabase.from("notifications").insert({
            company_id: item.company_id,
            user_id: item.user_id,
            title: item.title,
            message: item.message,
            type: "sistema",
            metadata: item.metadata || {},
          });
          if (notifErr) throw notifErr;

          await logResult(supabase, item, "enviado", "in_app inserted");
        }

        if (channel === "push") {
          if (!vapidPublicKey || !vapidPrivateKey) {
            await logResult(supabase, item, "erro", "VAPID keys not configured");
          } else {
            const { data: subs } = await supabase
              .from("push_subscriptions")
              .select("endpoint, keys")
              .eq("user_id", item.user_id);

            const pushBody = JSON.stringify({ title: item.title, body: item.message, type: "sistema", metadata: item.metadata });
            let sent = false;

            for (const sub of subs || []) {
              try {
                await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } }, pushBody);
                sent = true;
              } catch (pushErr: unknown) {
                const statusCode = (pushErr as { statusCode?: number })?.statusCode;
                if (statusCode === 410 || statusCode === 404) {
                  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
                }
              }
            }
            await logResult(supabase, item, sent ? "enviado" : "erro", sent ? "push sent" : "no valid subscriptions");
          }
        }

        if (channel === "whatsapp") {
          const { data: waConfig } = await supabase
            .from("whatsapp_configs")
            .select("provider, config_json")
            .eq("company_id", item.company_id)
            .eq("active", true)
            .maybeSingle();

          if (!waConfig) {
            await logResult(supabase, item, "erro", "No WhatsApp config");
          } else {
            const config = waConfig.config_json as Record<string, string>;
            const { data: profile } = await supabase.from("profiles").select("phone").eq("id", item.user_id).single();

            if (!profile?.phone) {
              await logResult(supabase, item, "erro", "User has no phone");
            } else {
              let response: Response;
              const text = `*${item.title}*\n${item.message}`;

              if (waConfig.provider === "meta") {
                response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_id}/messages`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ messaging_product: "whatsapp", to: profile.phone, type: "text", text: { body: text } }),
                });
              } else {
                response = await fetch(`${config.base_url}/message/sendText/${config.instance}`, {
                  method: "POST",
                  headers: { apikey: config.token, "Content-Type": "application/json" },
                  body: JSON.stringify({ number: profile.phone, text }),
                });
              }

              const respText = await response.text();
              await logResult(supabase, item, response.ok ? "enviado" : "erro", respText);
            }
          }
        }

        if (channel === "email") {
          await logResult(supabase, item, "erro", "Email channel not implemented yet");
        }

        // Mark as sent
        await supabase.from("automation_queue").update({ status: "enviado", processed_at: new Date().toISOString(), error_message: null }).eq("id", item.id);
        processed++;
      } catch (err) {
        await supabase.from("automation_queue").update({ status: "erro", error_message: String(err), processed_at: new Date().toISOString() }).eq("id", item.id);
        await logResult(supabase, item, "erro", String(err));
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function logResult(supabase: ReturnType<typeof createClient>, item: Record<string, unknown>, status: string, response: string) {
  await supabase.from("automation_logs").insert({
    company_id: item.company_id,
    automation_id: item.automation_id || null,
    queue_item_id: item.id,
    user_id: item.user_id,
    channel: item.channel,
    status,
    message: item.message as string,
    gateway_response: response,
  });
}
