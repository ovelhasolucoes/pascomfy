import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKET = "company-files";

const FILE_TYPE_FOLDERS: Record<string, string> = {
  imagem: "images",
  video: "videos",
  documento: "documents",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const body = await req.json();
    const { fileName, mimeType, sizeBytes, companyId, fileType } = body;

    if (!fileName || !mimeType || !sizeBytes || !companyId || !fileType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!FILE_TYPE_FOLDERS[fileType]) {
      return new Response(JSON.stringify({ error: "Invalid fileType. Use: imagem, video, documento" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check company limits
    const { data: limits, error: limitsError } = await supabaseAdmin.rpc("get_company_limits", {
      _company_id: companyId,
    });

    if (limitsError) {
      return new Response(JSON.stringify({ error: "Failed to check company limits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const limitsData = limits as { max_storage_mb: number; current_storage: number; max_uploads: number };
    const fileSizeMb = sizeBytes / (1024 * 1024);

    if (limitsData.current_storage + fileSizeMb > limitsData.max_storage_mb) {
      return new Response(JSON.stringify({ error: "Storage limit exceeded" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build path
    const folder = FILE_TYPE_FOLDERS[fileType];
    const ext = fileName.split(".").pop() || "";
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const path = `${companyId}/${folder}/${uniqueName}`;

    // Create signed upload URL
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (signedError || !signedData) {
      return new Response(JSON.stringify({ error: "Failed to create upload URL", details: signedError?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert file record
    const { data: fileRecord, error: fileError } = await supabaseAdmin
      .from("files")
      .insert({
        company_id: companyId,
        name: fileName,
        path,
        provider: "supabase",
        file_type: fileType,
        size_bytes: sizeBytes,
        mime_type: mimeType,
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (fileError) {
      return new Response(JSON.stringify({ error: "Failed to register file", details: fileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update company storage usage
    await supabaseAdmin.rpc("get_company_limits", { _company_id: companyId }); // no-op, actual update below
    await supabaseAdmin
      .from("companies")
      .update({ storage_used_mb: Math.ceil(limitsData.current_storage + fileSizeMb) })
      .eq("id", companyId);

    return new Response(
      JSON.stringify({
        fileId: fileRecord.id,
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        path,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
