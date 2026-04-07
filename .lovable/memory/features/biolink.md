---
name: Biolink Module
description: Biolink (link-in-bio) system per company with SSR Edge Function, click analytics, admin UI, and template gallery
type: feature
---
- Tables: biolinks (slug unique, company_id, cores, logo, ativo), biolink_items (tipo enum, ordem, ativo), biolink_clicks (tracking)
- Template tables: biolink_templates (global or per-company, categoria, preview_config), biolink_template_items (titulo, tipo, ordem, url_placeholder)
- 5 seed templates: Paróquia Padrão, Social, Transmissão, Doações, Minimalista
- Template flow: gallery → preview → select → create biolink → copy items (no link maintained)
- Edge Function: biolink-page — SSR HTML page, click tracking via ?click=item_id with 302 redirect
- Public URL: https://cchovdurprjtefisautg.supabase.co/functions/v1/biolink-page?slug=XXX
- Admin UI: /admin/biolink (AdminRoute protected)
- RLS: admin ALL, anon SELECT active, service_role INSERT clicks
- Templates RLS: global readable by all authenticated, company templates by company members, admin manages own company templates, super_admin manages all
- Analytics: click counts per item shown in admin editor
