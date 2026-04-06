---
name: Super Admin SaaS Core
description: Subscriptions, affiliates, support tickets, global logs, company limits, super admin panel
type: feature
---

## Tabelas Novas
- `subscriptions`: company_id, plan_id, status (ativo/cancelado/trial/atrasado), gateway, external_id
- `affiliate_program`: company_id, code (unique), commission_pct, active
- `affiliate_referrals`: affiliate_id, referred_company_id, status (pendente/convertido), reward_applied
- `support_tickets`: company_id, user_id, title, description, status (aberto/respondido/fechado)
- `support_messages`: ticket_id, user_id, message (CASCADE on ticket delete)
- `global_logs`: user_id, action, entity, entity_id, metadata, ip_address (super_admin only)

## Tabelas Expandidas
- `plans`: price_monthly, max_uploads, allows_whitelabel, allows_custom_domain, description
- `companies`: status (ativa/suspensa/cancelada), storage_used_mb, active_users_count, trial_until, custom_domain, settings, subscription_id

## Funções
- `get_company_limits(company_id)` → jsonb com max_users, max_storage_mb, max_uploads, current_users, current_storage

## RLS
- Super admin bypass em todas as tabelas novas
- Companies veem apenas seus dados (subscriptions, tickets, affiliates)
- global_logs exclusivo para super_admin

## Frontend
- 7 páginas em /superadmin/* (Dashboard, Companies, Plans, Subscriptions, Affiliates, Tickets, Logs)
- Hooks: useSuperAdminStats, useSubscriptions, useSupportTickets
- Componentes: MetricCard, CompanyDetailSheet, TicketThread
- Sidebar com seção "Super Admin" condicional (isSuperAdmin)
