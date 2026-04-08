---
name: Security Hardening
description: RLS fixes, plan validation triggers, privilege escalation prevention, performance indexes, webhook hardening
type: feature
---

## RLS Fixes Applied
- `user_roles`: admin cannot assign/update/delete `super_admin` role (prevents privilege escalation)
- `whatsapp_configs`: added super_admin management policy
- `platform_settings`: added public read policy (branding needs it)
- `support_messages`, `team_templates`: added super_admin policies

## Triggers de Segurança
- **`trg_prevent_role_escalation`** on `user_roles` INSERT/UPDATE — blocks non-super_admin from assigning super_admin role
- **`trg_prevent_role_escalation_delete`** on `user_roles` DELETE — blocks non-super_admin from removing super_admin role
- **`trg_protect_profile_fields`** on `profiles` UPDATE — blocks users from changing company_id, status, reliability_score, permission_level
- **`trg_prevent_invite_escalation`** on `invites` INSERT/UPDATE — blocks non-super_admin from inviting as super_admin
- **`trg_enforce_user_limit`** on `profiles` INSERT — blocks if max_users reached
- **`trg_enforce_upload_limit`** on `files` INSERT — blocks if max_uploads or max_storage reached
- **`trg_enforce_company_active_events`** on `events` INSERT — blocks if company suspended (hard mode)
- **`trg_enforce_company_active_files`** on `files` INSERT — blocks if company suspended (hard mode)
- All triggers skip for super_admin

## Webhook Hardening
- **asaas-webhook**: ASAAS_WEBHOOK_TOKEN is now MANDATORY (500 if not set, 401 if mismatch)
- **mercadopago-webhook**: validates x-signature HMAC if MERCADOPAGO_WEBHOOK_SECRET is configured; always validates payment via MP API server-side

## social_accounts_safe View
- View hides access_token and app_secret_encrypted
- Set to SECURITY INVOKER so RLS applies to querying user

## Edge Function `validate-plan-limits`
- Actions: add_user, upload_file, create_event, custom_domain, whitelabel
- Returns `{ allowed, reason, code }` with friendly messages
- Frontend hook: `src/hooks/usePlanLimits.ts` → `checkPlanLimit(action)`

## Performance Indexes
- Added indexes on company_id for: profiles, events, event_teams, event_team_members, notifications, files, automations, subscriptions
- Added indexes on user_id for: notifications, event_attendance
- Added index on event_id for: event_attendance

## Pending
- Leaked password protection (Supabase dashboard setting — enable in Auth > Settings)
