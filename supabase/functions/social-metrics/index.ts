import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);

    // Accept optional post_id for single refresh, otherwise batch all published
    const body = req.method === "POST" ? await req.json() : {};
    const singlePostId = body?.post_id as string | undefined;

    // Fetch published posts that have meta IDs
    let query = supabase
      .from("social_posts")
      .select("id, company_id, social_account_id, platform, meta_post_id, meta_ig_post_id")
      .eq("status", "publicado");

    if (singlePostId) {
      query = query.eq("id", singlePostId);
    }

    const { data: posts, error: postsErr } = await query;
    if (postsErr) throw postsErr;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique account IDs and fetch tokens
    const accountIds = [...new Set(posts.map((p) => p.social_account_id))];
    const { data: accounts, error: accErr } = await supabase
      .from("social_accounts")
      .select("id, access_token, page_id")
      .in("id", accountIds);
    if (accErr) throw accErr;

    const tokenMap = new Map(accounts?.map((a) => [a.id, a]) || []);

    let updated = 0;
    const errors: string[] = [];

    for (const post of posts) {
      const account = tokenMap.get(post.social_account_id);
      if (!account?.access_token) continue;

      try {
        let likes = 0, comments = 0, shares = 0;

        // Facebook metrics
        if (post.meta_post_id && (post.platform === "facebook" || post.platform === "ambos")) {
          const fbUrl = `https://graph.facebook.com/v21.0/${post.meta_post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token=${account.access_token}`;
          const fbRes = await fetch(fbUrl);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            likes += fbData.likes?.summary?.total_count || 0;
            comments += fbData.comments?.summary?.total_count || 0;
            shares += fbData.shares?.count || 0;
          }
        }

        // Instagram metrics
        if (post.meta_ig_post_id && (post.platform === "instagram" || post.platform === "ambos")) {
          const igUrl = `https://graph.facebook.com/v21.0/${post.meta_ig_post_id}?fields=like_count,comments_count&access_token=${account.access_token}`;
          const igRes = await fetch(igUrl);
          if (igRes.ok) {
            const igData = await igRes.json();
            likes += igData.like_count || 0;
            comments += igData.comments_count || 0;
          }
        }

        // Upsert metrics
        const { error: upsertErr } = await supabase
          .from("social_post_metrics")
          .upsert(
            {
              post_id: post.id,
              company_id: post.company_id,
              likes,
              comments,
              shares,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "post_id" }
          );

        if (upsertErr) {
          errors.push(`Post ${post.id}: ${upsertErr.message}`);
        } else {
          updated++;
        }
      } catch (e) {
        errors.push(`Post ${post.id}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({ updated, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
