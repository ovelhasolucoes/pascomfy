# Project Memory

## Core
Pascomfy — SaaS multi-tenant para gestão de equipes Pascom (paróquias).
Multi-tenant: todas entidades têm company_id. RLS isola dados por company.
Roles em tabela separada (user_roles): colaborador, admin, super_admin.
Funções SECURITY DEFINER: has_role(), get_user_company_id(), is_active_user(), check_user_permission(), get_company_limits().
Supabase para auth, DB, storage, realtime. Idioma: PT-BR.
Profiles expandido: status, phone, avatar_url, availability (jsonb), reliability_score, settings.
Super admin é global (sem company_id), bypass total via has_role.

## Memories
- [Arquitetura DB](mem://features/db-architecture) — Tabelas plans, companies, profiles, user_roles + trigger auto-profile
- [Permissões](mem://features/permissions) — RBAC híbrido com role_permissions + user_permissions overrides
- [Convites](mem://features/invites) — Fluxo de convite por token com vinculação automática à company
- [Eventos e Escalas](mem://features/events-scales) — events, event_types, team_templates, event_teams, event_team_members
- [Checklist e Presença](mem://features/checklist-attendance) — Checklist híbrido (individual/shared), presença com janela de tempo
- [Frontend Eventos](mem://features/frontend-events) — Telas de eventos, calendário, filtros, criação, detalhe, agenda pessoal
- [Super Admin](mem://features/superadmin) — Subscriptions, affiliates, tickets, logs, dashboard de métricas SaaS
