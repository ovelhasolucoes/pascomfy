---
name: Security Hardening
description: RLS fixes, plan validation triggers, privilege escalation prevention, performance indexes
type: feature
---

## RLS Fixes Applied
- `user_roles`: admin cannot assign/update/delete `super_admin` role (prevents privilege escalation)
- `whatsapp_configs`: added super_admin management policy
- `platform_settings`: added public read policy (branding needs it)
- `support_messages`, `team_templates`: added super_admin policies

## Plan Limit Validation (Backend)
- **Trigger `trg_enforce_user_limit`** on `profiles` INSERT — blocks if max_users reached
- **Trigger `trg_enforce_upload_limit`** on `files` INSERT — blocks if max_uploads or max_storage reached
- **Trigger `trg_enforce_company_active_events`** on `events` INSERT — blocks if company suspended (hard mode)
- **Trigger `trg_enforce_company_active_files`** on `files` INSERT — blocks if company suspended (hard mode)
- All triggers skip for super_admin

## Edge Function `validate-plan-limits`
- Actions: add_user, upload_file, create_event, custom_domain, whitelabel
- Returns `{ allowed, reason, code }` with friendly messages
- Frontend hook: `src/hooks/usePlanLimits.ts` → `checkPlanLimit(action)`

## Performance Indexes
- Added indexes on company_id for: profiles, events, event_teams, event_team_members, notifications, files, automations, subscriptions
- Added indexes on user_id for: notifications, event_attendance
- Added index on event_id for: event_attendance

## Pending
- Leaked password protection (Supabase dashboard setting)
- social_accounts: consider restricting SELECT to use social_accounts_safe view only
