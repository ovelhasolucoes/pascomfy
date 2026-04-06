import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ICONS: Record<string, string> = {
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  doacao: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  link: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
};

function renderPage(biolink: any, items: any[], baseUrl: string): string {
  const { titulo, descricao, logo_url, cor_primaria, cor_secundaria, slug } = biolink;

  const linksHtml = items.map((item) => {
    const icon = ICONS[item.tipo] || ICONS.link;
    const clickUrl = `${baseUrl}?slug=${slug}&click=${item.id}`;
    return `<a href="${clickUrl}" class="link-btn" rel="noopener noreferrer">
      <span class="link-icon">${icon}</span>
      <span>${escapeHtml(item.titulo)}</span>
    </a>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(titulo)}</title>
  <meta name="description" content="${escapeHtml(descricao || titulo)}">
  ${logo_url ? `<meta property="og:image" content="${escapeHtml(logo_url)}">` : ""}
  <meta property="og:title" content="${escapeHtml(titulo)}">
  <meta property="og:description" content="${escapeHtml(descricao || "")}">
  <meta property="og:type" content="website">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      background: linear-gradient(135deg, ${cor_primaria}, ${cor_secundaria});
      padding: 2rem 1rem;
    }
    .container {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .logo {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255,255,255,0.4);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    h1 {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .desc {
      color: rgba(255,255,255,0.9);
      font-size: 0.9rem;
      text-align: center;
      line-height: 1.4;
    }
    .links {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .link-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 12px;
      color: #fff;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .link-btn:hover {
      background: rgba(255,255,255,0.25);
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    .link-icon { display: flex; flex-shrink: 0; }
    .footer {
      margin-top: 2rem;
      color: rgba(255,255,255,0.5);
      font-size: 0.75rem;
    }
    .footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    ${logo_url ? `<img src="${escapeHtml(logo_url)}" alt="${escapeHtml(titulo)}" class="logo">` : ""}
    <h1>${escapeHtml(titulo)}</h1>
    ${descricao ? `<p class="desc">${escapeHtml(descricao)}</p>` : ""}
    <div class="links">${linksHtml}</div>
    <p class="footer"><a href="https://pascomfy.app">Pascomfy</a></p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function notFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Não encontrado</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6;color:#374151;}
.box{text-align:center;}h1{font-size:3rem;margin-bottom:0.5rem;}p{color:#6b7280;}</style>
</head><body><div class="box"><h1>404</h1><p>Página não encontrada</p></div></body></html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const clickId = url.searchParams.get("click");

  if (!slug) {
    return new Response(notFoundPage(), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Handle click tracking + redirect
  if (clickId) {
    const { data: item } = await supabase
      .from("biolink_items")
      .select("url, biolink_id")
      .eq("id", clickId)
      .eq("ativo", true)
      .single();

    if (item) {
      // Record click async (don't block redirect)
      supabase.from("biolink_clicks").insert({
        biolink_item_id: clickId,
        user_agent: req.headers.get("user-agent") || null,
        referer: req.headers.get("referer") || null,
      }).then(() => {});

      return new Response(null, {
        status: 302,
        headers: { Location: item.url },
      });
    }
  }

  // Load biolink
  const { data: biolink } = await supabase
    .from("biolinks")
    .select("*")
    .eq("slug", slug)
    .eq("ativo", true)
    .single();

  if (!biolink) {
    return new Response(notFoundPage(), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Load items
  const { data: items } = await supabase
    .from("biolink_items")
    .select("*")
    .eq("biolink_id", biolink.id)
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  const baseUrl = `${supabaseUrl}/functions/v1/biolink-page`;
  const html = renderPage(biolink, items || [], baseUrl);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
