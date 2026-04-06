

# Pascomfy — Sistema de Notificações Multi-Canal

## Resumo

Criar sistema completo de notificações com suporte a In-App (realtime), Push (Web Push) e WhatsApp (Meta/Evo configurável por company). Inclui disparo automático via triggers + edge functions, disparo manual por admin, e UI completa com sino/badge no header.

## Arquitetura

```text
┌───────────────────────────────────────────────────┐
│  Frontend                                          │
│  NotificationBell (header) ← Supabase Realtime     │
│  NotificationPanel (dropdown com lista)             │
│  AdminNotificationSend (disparo manual)             │
│  NotificationSettings (preferências do usuário)     │
└──────────┬────────────────────────────────────────┘
           │
     ┌─────┴─────┐
     │            │
  Triggers     Edge Functions
  (INSERT em    (send-notification)
  event_team    (scheduled: 24h reminder)
  _members)
     │            │
     └─────┬──────┘
           ▼
┌──────────────────────────┐
│  Edge Function:           │
│  send-notification        │
│  - insere notifications   │
│  - envia push (web-push)  │
│  - envia whatsapp         │
│  - registra logs          │
└──────────────────────────┘
```

## 1. Migração SQL

### Tabelas

**notifications** — notificações in-app
- `id`, `company_id`, `user_id`, `title`, `message`, `type` (escala/evento/aviso/sistema), `read` (boolean), `sent_at`, `created_at`, `metadata` (jsonb — event_id, etc.)

**notification_logs** — log de envio por canal
- `id`, `notification_id`, `channel` (push/whatsapp/in_app), `status` (enviado/erro), `gateway_response` (text), `created_at`

**user_notification_settings** — preferências por usuário
- `id`, `user_id`, `company_id`, `push_enabled` (default true), `whatsapp_enabled` (default false), `email_enabled` (default false), `created_at`

**push_subscriptions** — tokens de dispositivo Web Push
- `id`, `user_id`, `endpoint` (text unique), `keys` (jsonb — p256dh, auth), `created_at`

**whatsapp_configs** — config WhatsApp por company
- `id`, `company_id`, `provider` (meta/evo), `config_json` (jsonb — token, phone_id, base_url), `active` (boolean), `created_at`

**notification_templates** — templates reutilizáveis
- `id`, `company_id` (nullable para globais), `type`, `title`, `message_template`, `created_at`

### Índices
- `notifications(user_id, read)` — listar não-lidas
- `notifications(company_id, type)`
- `notification_logs(notification_id)`
- `push_subscriptions(user_id)`
- `whatsapp_configs(company_id, active)`

### RLS
- **notifications**: user vê as suas; admin insere na company; super_admin ALL
- **notification_logs**: mesmo que notifications (via join)
- **user_notification_settings**: user gerencia as suas; admin vê da company
- **push_subscriptions**: user gerencia as suas
- **whatsapp_configs**: admin gerencia da company; super_admin ALL
- **notification_templates**: admin gerencia da company; super_admin ALL

### Trigger automático
- `AFTER INSERT ON event_team_members` → chama `pg_net.http_post` para edge function `send-notification` com payload `{ type: 'escala', userId, eventId }`
- Mesmo padrão para `AFTER UPDATE ON events` (status changed)

## 2. Edge Function: `send-notification`

Responsabilidades:
1. Recebe `{ type, userId, companyId, title, message, metadata }`
2. Insere na tabela `notifications` (in-app)
3. Consulta `user_notification_settings` do destinatário
4. Se `push_enabled`: busca `push_subscriptions`, envia via web-push
5. Se `whatsapp_enabled`: busca `whatsapp_configs` da company, envia via provider ativo (Meta ou Evo)
6. Registra tudo em `notification_logs`
7. Suporta `bulk: true` para enviar para lista de userIds

### Secrets necessários
- `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (para Web Push)
- WhatsApp: config_json na tabela, sem secrets globais

## 3. Edge Function: `schedule-reminders`

- Chamada via pg_cron a cada hora
- Busca eventos nas próximas 24h com membros escalados
- Envia notificação de lembrete para cada membro
- Evita duplicidade com campo `metadata.reminder_sent`

## 4. Frontend — Componentes

### NotificationBell (no AppLayout header)
- Ícone de sino com badge de contagem de não-lidas
- Realtime subscription em `notifications` filtrado por `user_id`
- Click abre dropdown/panel

### NotificationPanel
- Lista de notificações com scroll
- Cada item: título, mensagem, tempo relativo, badge de tipo
- Click marca como lida
- Botão "marcar todas como lidas"

### NotificationSettings (página ou dialog)
- Toggles: push_enabled, whatsapp_enabled
- Registro de Push Subscription (botão "Ativar notificações push")

### AdminNotificationSend (página admin)
- Formulário: título, mensagem, tipo
- Destinatários: todos da company, equipe específica, usuários selecionados
- Preview antes de enviar

### WhatsAppConfig (página admin)
- Formulário: provider (meta/evo), config_json fields, toggle ativo
- Apenas 1 config ativa por company

## 5. Web Push — Service Worker

Seguindo as regras de PWA:
- **Sem service worker no preview** — guard contra iframe e hosts lovable
- `navigateFallbackDenylist: [/^\/~oauth/]`
- Registro condicional apenas em produção
- Edge function usa biblioteca `web-push` (Deno) para enviar

### Fluxo de registro
1. Usuário clica "Ativar Push" nas configurações
2. Frontend pede permissão do browser
3. `PushManager.subscribe()` com VAPID public key
4. Salva subscription em `push_subscriptions`

## 6. Hooks

- `useNotifications()` — lista com realtime, marcar lida, contagem
- `useNotificationSettings()` — CRUD preferências do usuário
- `usePushSubscription()` — registro/remoção de push
- `useAdminNotifications()` — envio manual (admin)

## 7. Rotas novas

- Nenhuma rota nova necessária — NotificationBell fica no header global
- Admin: adicionar aba "Notificações" nas configurações existentes ou nova rota `/admin/notifications`

## Ordem de Execução

1. Migração SQL (6 tabelas + índices + RLS + trigger)
2. Edge Function `send-notification`
3. Hook `useNotifications` + componentes NotificationBell/Panel
4. Hook `useNotificationSettings` + UI de preferências
5. Web Push (service worker + registro + VAPID keys)
6. Admin: envio manual + config WhatsApp
7. Edge Function `schedule-reminders` + pg_cron
8. Atualizar memória do projeto

## Detalhes Técnicos

- Realtime via `supabase.channel('notifications').on('postgres_changes', ...)` filtrado por user_id
- Web Push: VAPID keys geradas e armazenadas como secrets no Supabase
- WhatsApp Meta: POST para `graph.facebook.com/v18.0/{phone_id}/messages`
- WhatsApp Evo: POST para `{base_url}/message/sendText/{instance}`
- pg_cron para lembretes de 24h (INSERT via supabase--read_query, não migração)
- Trigger usa `pg_net` extension para HTTP POST assíncrono à edge function

