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

## Memories
- [Arquitetura DB](mem://features/db-architecture) — Tabelas plans, companies, profiles, user_roles + trigger auto-profile
- [Permissões](mem://features/permissions) — RBAC híbrido com role_permissions + user_permissions overrides
- [Convites](mem://features/invites) — Fluxo de convite por token com vinculação automática à company
- [Social Posts](mem://features/social-posts) — Meta Graph API v21.0, per-company Meta App, OAuth, FB/IG publishing, scheduling
