import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { action } = await req.json();

    if (!action || !["add_user", "upload_file", "create_event", "custom_domain", "whitelabel"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = profile.company_id;

    // Get company + plan info
    const { data: company } = await serviceClient
      .from("companies")
      .select("status, block_mode, subscription_id, subscriptions!companies_subscription_id_fkey(plan_id, status, plans(name, max_users, max_storage_mb, max_uploads, allows_custom_domain, allows_whitelabel))")
      .eq("id", companyId)
      .single();

    if (!company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check company status
    if (company.status === "suspensa" || company.status === "bloqueada") {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "Sua empresa está suspensa. Entre em contato com o suporte.",
        code: "company_blocked",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = (company as any).subscriptions?.plans;
    if (!plan) {
      return new Response(JSON.stringify({ allowed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check specific limits
    if (action === "add_user") {
      const { count } = await serviceClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "ativo");

      if ((count || 0) >= plan.max_users) {
        return new Response(JSON.stringify({
          allowed: false,
          reason: `Seu plano ${plan.name} permite no máximo ${plan.max_users} usuários. Você já tem ${count}. Faça upgrade para adicionar mais.`,
          code: "max_users_reached",
          current: count,
          limit: plan.max_users,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "upload_file") {
      const { count } = await serviceClient
        .from("files")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId);

      if ((count || 0) >= plan.max_uploads) {
        return new Response(JSON.stringify({
          allowed: false,
          reason: `Limite de ${plan.max_uploads} uploads atingido no plano ${plan.name}.`,
          code: "max_uploads_reached",
          current: count,
          limit: plan.max_uploads,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: storageData } = await serviceClient
        .from("companies")
        .select("storage_used_mb")
        .eq("id", companyId)
        .single();

      if ((storageData?.storage_used_mb || 0) >= plan.max_storage_mb) {
        return new Response(JSON.stringify({
          allowed: false,
          reason: `Armazenamento cheio (${plan.max_storage_mb} MB). Faça upgrade do plano.`,
          code: "max_storage_reached",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "custom_domain" && !plan.allows_custom_domain) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: `O plano ${plan.name} não permite domínio customizado. Faça upgrade.`,
        code: "feature_not_allowed",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "whitelabel" && !plan.allows_whitelabel) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: `O plano ${plan.name} não permite white label. Faça upgrade.`,
        code: "feature_not_allowed",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ allowed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
