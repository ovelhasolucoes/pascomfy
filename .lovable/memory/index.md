# Project Memory

## Core
Pascomfy — SaaS multi-tenant para gestão de equipes Pascom (paróquias).
Multi-tenant: todas entidades têm company_id. RLS isola dados por company.
Roles em tabela separada (user_roles): colaborador, admin, super_admin.
Funções SECURITY DEFINER: has_role(), get_user_company_id(), is_active_user(), check_user_permission().
Supabase para auth, DB, storage, realtime. Idioma: PT-BR.
Profiles expandido: status, phone, avatar_url, availability (jsonb), reliability_score, settings.

## Memories
- [Arquitetura DB](mem://features/db-architecture) — Tabelas plans, companies, profiles, user_roles + trigger auto-profile
- [Permissões](mem://features/permissions) — RBAC híbrido com role_permissions + user_permissions overrides
- [Convites](mem://features/invites) — Fluxo de convite por token com vinculação automática à company
- [Eventos & Escalas](mem://features/events-scales) — Tabelas events, event_types, team_templates, event_teams, event_team_members
- [Checklist & Presença (backend)](mem://features/checklist-attendance) — Templates, checklists por evento, progresso, attendance com Realtime
- [Frontend Operacional](mem://features/frontend-events) — Hooks e componentes para checklist híbrido, check-in, modo foco com Realtime
