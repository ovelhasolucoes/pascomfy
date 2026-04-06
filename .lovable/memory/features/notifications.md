---
name: Sistema de Notificações Multi-Canal
description: In-App (realtime), Push (Web Push stub), WhatsApp (Meta/Evo por company), triggers automáticos, envio manual admin
type: feature
---

## Tabelas
- `notifications` — in-app com type enum (escala/evento/aviso/sistema), realtime habilitado
- `notification_logs` — log por canal (push/whatsapp/in_app) com status
- `user_notification_settings` — toggles push/whatsapp/email por user
- `push_subscriptions` — Web Push endpoints + keys
- `whatsapp_configs` — config por company (meta/evo), config_json, active
- `notification_templates` — templates reutilizáveis com placeholders

## Triggers automáticos
- `on_event_team_member_added` → insere notificação tipo 'escala'
- `on_event_updated` → notifica todos membros quando status muda

## Edge Functions
- `send-notification` — orquestra envio multi-canal (in_app + push + whatsapp)
- Push: stub preparado, precisa VAPID keys
- WhatsApp: Meta API + Evo API, config na tabela whatsapp_configs

## Frontend
- `NotificationBell` no header (AppLayout) com badge de não-lidas
- `NotificationPanel` dropdown com lista e marcar lida
- `NotificationSettings` toggles do usuário
- `AdminNotificationSend` envio manual com seleção de destinatários
- `WhatsAppConfig` config do provider por company
- Rota: `/admin/notifications`

## Hooks
- `useNotifications()` — lista + realtime + marcar lida
- `useNotificationSettings()` — upsert preferências
- `useAdminNotifications()` — envio manual bulk
