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
- [Eventos e Escalas](mem://features/events-scales) — Tabelas events, event_types, team_templates, event_teams, event_team_members
- [Checklist e Attendance](mem://features/checklist-attendance) — Checklists de evento com progress e controle de presença
- [Super Admin](mem://features/superadmin) — Painel SaaS: dashboard, companies, planos, assinaturas, afiliados, tickets, logs
- [Frontend Events](mem://features/frontend-events) — Páginas de eventos, calendário, criação, detalhe, live mode
- [Storage](mem://features/storage) — StorageService multi-provider, tabela files, bucket company-files, Edge Function generate-upload-url
- [Notificações](mem://features/notifications) — Multi-canal (In-App realtime, Push stub, WhatsApp Meta/Evo), triggers automáticos, envio manual admin
