---
name: Biolink Module
description: Biolink (link-in-bio) system per company with SSR Edge Function, click analytics, admin UI
type: feature
---
- Tables: biolinks (slug unique, company_id, cores, logo, ativo), biolink_items (tipo enum, ordem, ativo), biolink_clicks (tracking)
- Edge Function: biolink-page — SSR HTML page, click tracking via ?click=item_id with 302 redirect
- Public URL: https://cchovdurprjtefisautg.supabase.co/functions/v1/biolink-page?slug=XXX
- Admin UI: /admin/biolink (AdminRoute protected)
- RLS: admin ALL, anon SELECT active, service_role INSERT clicks
- Analytics: click counts per item shown in admin editor
