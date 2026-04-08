---
name: Super Admin SaaS Core
description: Isolated SA panel with own layout/sidebar, company detail page with tabs, impersonation stub, domains, integrations, SA users
type: feature
---

## Layout
- `SuperAdminLayout` + `SuperAdminSidebar` — layout completamente separado do AppLayout
- Sidebar tem seções: Visão Geral, Gestão, Financeiro, Suporte, Sistema
- Badge "Super Admin" no header
- AppSidebar/MoreSheet mostram apenas link "Painel Super Admin" para SA

## Rotas
- `/superadmin` → Dashboard
- `/superadmin/companies` → Lista (navega para detalhe)
- `/superadmin/companies/:id` → Detalhe com 6 abas (Geral, Plano, Usuários, Domínio, Uso, Ações)
- `/superadmin/users` → Apenas super_admins
- `/superadmin/plans`, `/subscriptions`, `/payments`, `/affiliates`, `/tickets`, `/logs`
- `/superadmin/domains` → Domínios custom das companies
- `/superadmin/integrations` → WhatsApp + Meta API global
- `/superadmin/settings` → Branding, Login, Gateways, Notificações, Avisos

## Dashboard Métricas
- activeCompanies, mrr, totalUsers, openTickets, trialCompanies, delinquentCompanies, crescimento mensal

## Impersonação
- Stub na aba "Ações" do company detail — Edge Function `impersonate-company` pendente

## Tabelas (já existentes)
- subscriptions, affiliate_program, affiliate_referrals, support_tickets, support_messages, global_logs
- plans, companies (status, storage_used_mb, active_users_count, trial_until, custom_domain)
