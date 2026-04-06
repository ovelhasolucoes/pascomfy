import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "escala" | "evento" | "aviso" | "sistema";
  userId?: string;
  userIds?: string[];
  companyId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

    // Validate JWT — only admins or service role can send notifications
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = authData.user.id;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check caller is admin or super_admin
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId);

    const roles = (callerRoles || []).map((r: { role: string }) => r.role);
    const isAdmin = roles.includes("admin") || roles.includes("super_admin");

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If admin (not super_admin), verify they belong to the target company
    if (!roles.includes("super_admin")) {
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", callerUserId)
        .single();

      const payload: NotificationPayload = await req.clone().json();
      if (!callerProfile || callerProfile.company_id !== payload.companyId) {
        return new Response(JSON.stringify({ error: "Forbidden: company mismatch" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(
        "mailto:admin@pascomfy.com.br",
        vapidPublicKey,
        vapidPrivateKey
      );
    }

    const payload: NotificationPayload = await req.json();
    const userIds = payload.userIds || (payload.userId ? [payload.userId] : []);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No target users" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Insert in-app notifications
    const notifRows = userIds.map((uid) => ({
      company_id: payload.companyId,
      user_id: uid,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      metadata: payload.metadata || {},
    }));

    const { data: notifications, error: notifError } = await supabase
      .from("notifications")
      .insert(notifRows)
      .select("id, user_id");

    if (notifError) throw notifError;

    // 2. Log in-app delivery
    if (notifications) {
      const logs = notifications.map((n: { id: string }) => ({
        notification_id: n.id,
        channel: "in_app" as const,
        status: "enviado" as const,
      }));
      await supabase.from("notification_logs").insert(logs);
    }

    // 3. Process each notification for push/whatsapp
    for (const notif of notifications || []) {
      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("push_enabled, whatsapp_enabled")
        .eq("user_id", notif.user_id)
        .maybeSingle();

      // Web Push with encrypted payload
      if (settings?.push_enabled && vapidPublicKey && vapidPrivateKey) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, keys")
          .eq("user_id", notif.user_id);

        const pushBody = JSON.stringify({
          title: payload.title,
          body: payload.message,
          type: payload.type,
          metadata: payload.metadata,
        });

        for (const sub of subs || []) {
          try {
            const pushSub = {
              endpoint: sub.endpoint,
              keys: sub.keys as { p256dh: string; auth: string },
            };

            await webpush.sendNotification(pushSub, pushBody);

            await supabase.from("notification_logs").insert({
              notification_id: notif.id,
              channel: "push",
              status: "enviado",
              gateway_response: "ok",
            });
          } catch (pushErr: unknown) {
            const statusCode = (pushErr as { statusCode?: number })?.statusCode;

            await supabase.from("notification_logs").insert({
              notification_id: notif.id,
              channel: "push",
              status: "erro",
              gateway_response: String(pushErr),
            });

            // Remove expired/invalid subscriptions
            if (statusCode === 410 || statusCode === 404) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", sub.endpoint);
            }
          }
        }
      }

      // WhatsApp
      if (settings?.whatsapp_enabled) {
        const { data: waConfig } = await supabase
          .from("whatsapp_configs")
          .select("provider, config_json")
          .eq("company_id", payload.companyId)
          .eq("active", true)
          .maybeSingle();

        if (waConfig) {
          try {
            const config = waConfig.config_json as Record<string, string>;
            const { data: profile } = await supabase
              .from("profiles")
              .select("phone")
              .eq("id", notif.user_id)
              .single();

            if (profile?.phone) {
              let response: Response;
              if (waConfig.provider === "meta") {
                response = await fetch(
                  `https://graph.facebook.com/v18.0/${config.phone_id}/messages`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${config.token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      messaging_product: "whatsapp",
                      to: profile.phone,
                      type: "text",
                      text: { body: `*${payload.title}*\n${payload.message}` },
                    }),
                  }
                );
              } else {
                response = await fetch(
                  `${config.base_url}/message/sendText/${config.instance}`,
                  {
                    method: "POST",
                    headers: {
                      apikey: config.token,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      number: profile.phone,
                      text: `*${payload.title}*\n${payload.message}`,
                    }),
                  }
                );
              }

              await supabase.from("notification_logs").insert({
                notification_id: notif.id,
                channel: "whatsapp",
                status: response.ok ? "enviado" : "erro",
                gateway_response: await response.text(),
              });
            }
          } catch (waError) {
            await supabase.from("notification_logs").insert({
              notification_id: notif.id,
              channel: "whatsapp",
              status: "erro",
              gateway_response: String(waError),
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: notifications?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
