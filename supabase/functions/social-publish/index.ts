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
    const { post_id } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "Missing post_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get post
    const { data: post, error: postErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get social account
    const { data: account } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", post.social_account_id)
      .single();

    if (!account || !account.access_token) {
      await supabase
        .from("social_posts")
        .update({ status: "erro", error_message: "Conta não conectada ou token ausente" })
        .eq("id", post_id);
      return new Response(JSON.stringify({ error: "Account not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check token expiration
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      await supabase
        .from("social_accounts")
        .update({ status: "erro" })
        .eq("id", account.id);
      await supabase
        .from("social_posts")
        .update({ status: "erro", error_message: "Token expirado. Reconecte a conta Meta." })
        .eq("id", post_id);
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as publishing
    await supabase
      .from("social_posts")
      .update({ status: "publicando" })
      .eq("id", post_id);

    const token = account.access_token;
    const mediaUrls: string[] = post.media_urls || [];
    const platform = post.platform;
    let fbPostId = null;
    let igPostId = null;
    const errors: string[] = [];

    // Publish to Facebook
    if (platform === "facebook" || platform === "ambos") {
      try {
        fbPostId = await publishToFacebook(account.page_id, token, post.caption, mediaUrls, post.scheduled_at);
      } catch (e: any) {
        errors.push(`Facebook: ${e.message}`);
      }
    }

    // Publish to Instagram
    if (platform === "instagram" || platform === "ambos") {
      if (!account.instagram_id) {
        errors.push("Instagram: Conta Instagram não vinculada");
      } else {
        try {
          igPostId = await publishToInstagram(account.instagram_id, token, post.caption, mediaUrls, post.scheduled_at);
        } catch (e: any) {
          errors.push(`Instagram: ${e.message}`);
        }
      }
    }

    // Update post status
    const hasErrors = errors.length > 0;
    const isScheduled = post.scheduled_at && new Date(post.scheduled_at) > new Date();

    await supabase
      .from("social_posts")
      .update({
        status: hasErrors ? "erro" : isScheduled ? "agendado" : "publicado",
        error_message: hasErrors ? errors.join("; ") : null,
        meta_post_id: fbPostId,
        meta_ig_post_id: igPostId,
        published_at: !hasErrors && !isScheduled ? new Date().toISOString() : null,
      })
      .eq("id", post_id);

    // Cleanup temp media
    if (!hasErrors && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          const path = new URL(url).pathname.split("/social-temp/")[1];
          if (path) {
            await supabase.storage.from("social-temp").remove([decodeURIComponent(path)]);
          }
        } catch {}
      }
    }

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        meta_post_id: fbPostId,
        meta_ig_post_id: igPostId,
        errors,
      }),
      {
        status: hasErrors ? 207 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("social-publish error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function publishToFacebook(
  pageId: string,
  token: string,
  caption: string | null,
  mediaUrls: string[],
  scheduledAt: string | null
): Promise<string> {
  const scheduledTime = scheduledAt ? Math.floor(new Date(scheduledAt).getTime() / 1000) : null;
  const isScheduled = scheduledTime && scheduledTime > Math.floor(Date.now() / 1000) + 600; // at least 10 min in future

  if (mediaUrls.length > 0) {
    // Photo post
    const params: Record<string, string> = {
      url: mediaUrls[0],
      access_token: token,
    };
    if (caption) params.caption = caption;
    if (isScheduled) {
      params.scheduled_publish_time = String(scheduledTime);
      params.published = "false";
    }

    const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.id || data.post_id;
  } else {
    // Text-only post
    const params: Record<string, string> = {
      message: caption || "",
      access_token: token,
    };
    if (isScheduled) {
      params.scheduled_publish_time = String(scheduledTime);
      params.published = "false";
    }

    const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.id;
  }
}

async function publishToInstagram(
  igId: string,
  token: string,
  caption: string | null,
  mediaUrls: string[],
  scheduledAt: string | null
): Promise<string> {
  if (mediaUrls.length === 0) {
    throw new Error("Instagram requer pelo menos uma imagem");
  }

  // IG doesn't support native scheduling — if scheduled, the cron job will call this later
  // Create media container
  const containerRes = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: mediaUrls[0],
      caption: caption || "",
      access_token: token,
    }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(containerData.error.message);

  const containerId = containerData.id;

  // Wait for container to be ready (poll)
  let ready = false;
  for (let i = 0; i < 10; i++) {
    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`
    );
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") {
      ready = true;
      break;
    }
    if (statusData.status_code === "ERROR") {
      throw new Error("Instagram media processing failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!ready) throw new Error("Instagram media processing timeout");

  // Publish
  const pubRes = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });
  const pubData = await pubRes.json();
  if (pubData.error) throw new Error(pubData.error.message);

  return pubData.id;
}
