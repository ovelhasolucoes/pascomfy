import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

const GRAPH_API = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // company_id:social_account_id

    if (!code || !state) {
      return new Response(JSON.stringify({ error: "Missing code or state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [companyId, socialAccountId] = state.split(":");
    if (!companyId || !socialAccountId) {
      return new Response(JSON.stringify({ error: "Invalid state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get social account with app credentials
    const { data: account, error: accErr } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", socialAccountId)
      .eq("company_id", companyId)
      .single();

    if (accErr || !account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = account.app_id;
    const appSecret = account.app_secret_encrypted; // stored as plain for now (pgcrypto can be added)
    const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth`;

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `${GRAPH_API}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      await supabase
        .from("social_accounts")
        .update({ status: "erro" })
        .eq("id", socialAccountId);
      return redirectToApp(companyId, "error", tokenData.error.message);
    }

    // 2. Exchange for long-lived token
    const longRes = await fetch(
      `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || tokenData.access_token;
    const expiresIn = longData.expires_in || 5184000; // 60 days default

    // 3. Get user's pages
    const pagesRes = await fetch(
      `${GRAPH_API}/me/accounts?access_token=${longToken}&fields=id,name,access_token,instagram_business_account`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      await supabase
        .from("social_accounts")
        .update({ status: "erro", access_token: longToken })
        .eq("id", socialAccountId);
      return redirectToApp(companyId, "error", "No pages found");
    }

    const page = pagesData.data[0]; // Use first page
    const pageToken = page.access_token;

    // 4. Get Instagram Business Account
    let igId = null;
    let igUsername = null;
    if (page.instagram_business_account) {
      igId = page.instagram_business_account.id;
      const igRes = await fetch(
        `${GRAPH_API}/${igId}?fields=username&access_token=${pageToken}`
      );
      const igData = await igRes.json();
      igUsername = igData.username || null;
    }

    // 5. Update social account
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    await supabase
      .from("social_accounts")
      .update({
        access_token: pageToken, // Use PAGE token (has page permissions)
        token_expires_at: expiresAt,
        page_id: page.id,
        page_name: page.name,
        instagram_id: igId,
        instagram_username: igUsername,
        status: "ativo",
      })
      .eq("id", socialAccountId);

    return redirectToApp(companyId, "success");
  } catch (err) {
    console.error("meta-oauth error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function redirectToApp(companyId: string, status: string, msg?: string) {
  const baseUrl = Deno.env.get("SITE_URL") || "https://id-preview--4bdb2505-cf19-45a5-a72d-5211090c2e00.lovable.app";
  const params = new URLSearchParams({ status });
  if (msg) params.set("message", msg);
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}/social/accounts?${params.toString()}`,
      ...corsHeaders,
    },
  });
}
