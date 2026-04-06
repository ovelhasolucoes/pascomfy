---
name: White Label & Custom Domain
description: Per-company theming (colors, logo, light/dark, favicon) + custom domain with DNS verification
type: feature
---
- Companies table has: theme (light/dark), favicon_url, domain_verified, custom_domain (unique partial index)
- CompanyThemeProvider context detects hostname, resolves company, applies CSS vars + dark class + favicon
- Whitelabel features gated by plans.allows_whitelabel; custom domain by plans.allows_custom_domain
- AdminSettings shows "Identidade" and "Domínio" tabs conditionally based on plan
- Edge function verify-domain checks CNAME to app.pascomfy.com or TXT record with company_id
- Anon RLS policy allows resolving company by verified custom_domain
- AppSidebar shows company logo/name when whitelabel active, else "Pascomfy"
- BioPublicPage always shows "Powered by PASCOMFY" footer
