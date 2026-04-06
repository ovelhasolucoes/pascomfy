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
- [Afiliados](mem://features/affiliates) — Programa de indicação com signup público, rewards automáticos, conversão no webhook
- [Biolink](mem://features/biolink) — Editor de biolink com drag-and-drop, preview, ícones coloridos
- [Checklist/Attendance](mem://features/checklist-attendance) — Checklists de evento com progresso realtime
- [Notificações](mem://features/notifications) — Push, WhatsApp, in-app com templates
- [Social Posts](mem://features/social-posts) — Publicação em redes sociais via Meta API
- [Storage](mem://features/storage) — Upload de arquivos com Supabase Storage e R2
- [Super Admin](mem://features/superadmin) — Dashboard, companies, planos, assinaturas, pagamentos, tickets, logs
- [Frontend Events](mem://features/frontend-events) — Eventos, escalas, times, calendário
