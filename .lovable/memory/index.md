# Memory: index.md
Updated: now

# Project Memory

## Core
Pascomfy — SaaS multi-tenant para gestão de equipes Pascom (paróquias).
Multi-tenant: todas entidades têm company_id. RLS isola dados por company.
Roles em tabela separada (user_roles): colaborador, admin, super_admin.
Funções SECURITY DEFINER: has_role(), get_user_company_id(), is_active_user(), check_user_permission().
Supabase para auth, DB, storage, realtime. Idioma: PT-BR.
Profiles expandido: status, phone, avatar_url, availability (jsonb), reliability_score, settings.
Design: paleta #c4a983 (bege dourado), minimalista, acolhedor. Sem azul.
Plan limits enforced via SQL triggers + Edge Function validate-plan-limits.

## Memories
- [Arquitetura DB](mem://features/db-architecture) — Tabelas plans, companies, profiles, user_roles + trigger auto-profile
- [Permissões](mem://features/permissions) — RBAC híbrido com role_permissions + user_permissions overrides
- [Convites](mem://features/invites) — Fluxo de convite por token com vinculação automática à company
- [Design UX Clean](mem://design/ux-clean) — Paleta #c4a983, design minimalista, sidebar flat, dashboard simplificado
- [Super Admin](mem://features/superadmin) — Painel SA isolado, company detail com abas, impersonação
- [Security Hardening](mem://features/security-hardening) — RLS fixes, plan triggers, privilege escalation prevention, indexes
- [Eventos/Escalas](mem://features/events-scales) — events, event_types, teams, team_members com RLS
- [Storage](mem://features/storage) — R2/Supabase dual provider, bucket company-files
- [Automações](mem://features/automations) — Triggers DB + Edge Function process-automation-queue
- [Notificações](mem://features/notifications) — In-app, push, WhatsApp
- [Biolink](mem://features/biolink) — Biolinks com templates, clicks, slug público
- [Social Posts](mem://features/social-posts) — Meta API, agendamento, métricas
- [Gamificação](mem://features/gamification) — Pontos por presença/checklist, níveis
- [Afiliados](mem://features/affiliates) — Código de indicação, recompensas
- [White Label](mem://features/whitelabel) — Cores, logo, domínio custom por company
- [QR Checkin](mem://features/qr-checkin) — QR code por evento e voluntário
- [Checklist/Presença](mem://features/checklist-attendance) — Checklists por evento, progresso compartilhado
- [Mobile UX](mem://features/mobile-ux) — BottomNav, MoreSheet, responsivo
- [Frontend Events](mem://features/frontend-events) — Calendário, filtros, live mode
