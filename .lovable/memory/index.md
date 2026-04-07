# Project Memory

## Core
Pascomfy — SaaS multi-tenant para gestão de equipes Pascom (paróquias).
Multi-tenant: todas entidades têm company_id. RLS isola dados por company.
Roles em tabela separada (user_roles): colaborador, admin, super_admin.
Funções SECURITY DEFINER: has_role(), get_user_company_id(), is_active_user(), check_user_permission().
Supabase para auth, DB, storage, realtime. Idioma: PT-BR.
Profiles expandido: status, phone, avatar_url, availability (jsonb), reliability_score, settings, bio, skills, preferred_roles.
Dashboard unificado na rota / com cards por role.
Mobile-first: bottom nav (Home/Eventos/Agenda/Perfil/Mais), sidebar só desktop, safe areas iPhone.

## Memories
- [Arquitetura DB](mem://features/db-architecture) — Tabelas plans, companies, profiles, user_roles + trigger auto-profile
- [Permissões](mem://features/permissions) — RBAC híbrido com role_permissions + user_permissions overrides
- [Convites](mem://features/invites) — Fluxo de convite por token com vinculação automática à company
- [Gamificação](mem://features/gamification) — Pontos automáticos, níveis, ranking, substituições, dashboard unificado, perfil expandido
- [White Label](mem://features/whitelabel) — Tema por empresa (cores, logo, favicon), domínio customizado com verificação DNS
- [Notificações](mem://features/notifications) — Push, WhatsApp, in-app com templates configuráveis
- [Social Posts](mem://features/social-posts) — Posts para Facebook/Instagram via Meta API
- [Biolink](mem://features/biolink) — Página pública de links da empresa
- [Afiliados](mem://features/affiliates) — Programa de indicação com recompensas
- [Storage](mem://features/storage) — Upload de arquivos com providers Supabase/R2
- [Super Admin](mem://features/superadmin) — Dashboard global, empresas, planos, logs
- [Eventos/Escalas](mem://features/events-scales) — Eventos, equipes, membros, checklists
- [Checklist/Attendance](mem://features/checklist-attendance) — Checklist por evento com progresso e presença
- [Automações](mem://features/automations) — Sistema multi-canal com fila, triggers automáticos, disparo manual, montagem de mensagem de grupo
- [Mobile UX](mem://features/mobile-ux) — Bottom nav, more sheet, safe areas, fases de melhoria mobile
- [QR Check-in](mem://features/qr-checkin) — Check-in via QR code (evento + voluntário), câmera + link, janela de tempo
