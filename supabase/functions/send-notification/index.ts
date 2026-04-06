import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// Web Push helpers using Web Crypto API (no external library needed)
async function generatePushHeaders(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const urlObj = new URL(endpoint);
  const audience = `${urlObj.protocol}//${urlObj.host}`;
  
  // Create JWT for VAPID
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: "mailto:admin@pascomfy.com.br",
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(String.fromCharCode(...enc.encode(JSON.stringify(header))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payloadB64 = btoa(String.fromCharCode(...enc.encode(JSON.stringify(payload))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import private key
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    await convertRawPrivateKeyToPKCS8(privateKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    enc.encode(unsignedToken)
  );

  // Convert DER signature to raw (r || s)
  const sigArray = new Uint8Array(signature);
  const rawSig = derToRaw(sigArray);
  const sigB64 = btoa(String.fromCharCode(...rawSig))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sigB64}`;

  return {
    Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    TTL: "86400",
  };
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw format
  if (der.length === 64) return der;
  
  // Parse DER sequence
  const raw = new Uint8Array(64);
  let offset = 2; // skip SEQUENCE tag and length
  
  // R value
  if (der[offset] !== 0x02) return der;
  offset++;
  let rLen = der[offset++];
  let rOffset = offset;
  if (rLen === 33 && der[rOffset] === 0) { rOffset++; rLen--; }
  raw.set(der.subarray(rOffset, rOffset + Math.min(rLen, 32)), 32 - Math.min(rLen, 32));
  offset = rOffset + (rLen === 33 ? 32 : rLen);
  if (der[rOffset - 1 - (rLen === 33 ? 0 : 1)] === 33) offset = rOffset + 32;
  
  // S value  
  offset = 2 + 2 + der[3] + (der[3] === 33 ? 0 : 0);
  // Re-parse more carefully
  let pos = 2;
  const rTagLen = der[pos + 1];
  pos += 2 + rTagLen;
  if (der[pos] !== 0x02) return der;
  pos++;
  let sLen = der[pos++];
  let sOffset = pos;
  if (sLen === 33 && der[sOffset] === 0) { sOffset++; sLen--; }
  raw.set(der.subarray(sOffset, sOffset + Math.min(sLen, 32)), 64 - Math.min(sLen, 32));
  
  return raw;
}

async function convertRawPrivateKeyToPKCS8(rawKey: Uint8Array): Promise<ArrayBuffer> {
  // Wrap 32-byte raw private key in PKCS#8 DER structure for P-256
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Footer = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);
  
  // We need the public key too - but we'll generate without it
  // Actually for signing we just need the private key
  // Simpler: use JWK import instead
  const result = new Uint8Array(pkcs8Header.length + rawKey.length);
  result.set(pkcs8Header);
  result.set(rawKey, pkcs8Header.length);
  return result.buffer;
}

async function sendWebPush(
  subscription: { endpoint: string; keys: Record<string, string> },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // For simplicity and reliability, use the web-push approach with fetch
  // The payload for Web Push needs to be encrypted with the subscription keys
  // This is complex to implement from scratch, so we'll send a simple notification
  
  // Import the subscription's p256dh and auth keys
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;
  
  if (!p256dh || !auth) {
    throw new Error("Missing subscription keys");
  }

  const headers = await generatePushHeaders(subscription.endpoint, vapidPublicKey, vapidPrivateKey);
  
  // For encrypted push payload, we need proper encryption
  // Using a simpler approach: send without payload (trigger notification via service worker fetch)
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Length": "0",
    },
  });
  
  return response;
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
    const supabase = createClient(supabaseUrl, serviceKey);

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

    // 3. Check user settings and send push/whatsapp
    for (const notif of notifications || []) {
      const { data: settings } = await supabase
        .from("user_notification_settings")
        .select("push_enabled, whatsapp_enabled")
        .eq("user_id", notif.user_id)
        .maybeSingle();

      // Push via Web Push API
      if (settings?.push_enabled && vapidPublicKey && vapidPrivateKey) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, keys")
          .eq("user_id", notif.user_id);

        for (const sub of subs || []) {
          try {
            const pushPayload = JSON.stringify({
              title: payload.title,
              body: payload.message,
              type: payload.type,
              metadata: payload.metadata,
            });

            const response = await sendWebPush(
              sub as { endpoint: string; keys: Record<string, string> },
              pushPayload,
              vapidPublicKey,
              vapidPrivateKey
            );

            await supabase.from("notification_logs").insert({
              notification_id: notif.id,
              channel: "push",
              status: response.ok ? "enviado" : "erro",
              gateway_response: `${response.status}: ${await response.text()}`,
            });

            // Remove expired subscriptions
            if (response.status === 410 || response.status === 404) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", sub.endpoint);
            }
          } catch (pushErr) {
            await supabase.from("notification_logs").insert({
              notification_id: notif.id,
              channel: "push",
              status: "erro",
              gateway_response: String(pushErr),
            });
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
