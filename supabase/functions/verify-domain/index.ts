import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { custom_domain } = await req.json();
    if (!custom_domain || typeof custom_domain !== "string") {
      return new Response(JSON.stringify({ error: "Domínio inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domain = custom_domain.trim().toLowerCase();

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's company
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check domain not taken by another company
    const { data: existing } = await adminClient
      .from("companies")
      .select("id")
      .eq("custom_domain", domain)
      .neq("id", profile.company_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Domínio já está em uso por outra empresa", verified: false }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DNS verification: check CNAME points to app.pascomfy.com
    let verified = false;
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const dnsData = await dnsRes.json();

      if (dnsData.Answer) {
        verified = dnsData.Answer.some(
          (record: { data: string }) =>
            record.data?.replace(/\.$/, "").toLowerCase() === "app.pascomfy.com"
        );
      }

      // Fallback: check A record or TXT record
      if (!verified) {
        const txtRes = await fetch(`https://dns.google/resolve?name=_pascomfy.${domain}&type=TXT`);
        const txtData = await txtRes.json();
        if (txtData.Answer) {
          verified = txtData.Answer.some(
            (record: { data: string }) =>
              record.data?.includes(profile.company_id)
          );
        }
      }
    } catch (dnsError) {
      console.error("DNS lookup error:", dnsError);
    }

    // Update company
    const { error: updateError } = await adminClient
      .from("companies")
      .update({
        custom_domain: domain,
        domain_verified: verified,
      })
      .eq("id", profile.company_id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        verified,
        domain,
        message: verified
          ? "Domínio verificado com sucesso!"
          : "CNAME não encontrado. Aponte um CNAME para app.pascomfy.com e tente novamente.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("verify-domain error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
