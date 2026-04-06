

# Automações Multi-Canal — Pascomfy

## Resumo

Criar sistema de automações dentro da tela `/admin/notifications` com novas abas: Automações (CRUD de regras), Disparo Manual (com montagem de mensagem de grupo), e Logs. Backend: tabela de fila (`automation_queue`) processada via trigger pg_net chamando edge function, tabelas de automações/logs, e edge function orquestradora.

## Arquitetura

```text
┌─────────────────────────────────────────────────┐
│  Admin cria automação (gatilho + template)       │
│  Ex: "usuario_escalado" → WhatsApp + Push        │
│                                                   │
│  Gatilho dispara (trigger SQL ou cron):           │
│  ├─ INSERT em automation_queue                    │
│  └─ trigger pg_net chama edge function            │
│       process-automation-queue                    │
│                                                   │
│  Edge function:                                   │
│  ├─ Lê item da fila                              │
│  ├─ Resolve template com variáveis               │
│  ├─ Envia via send-notification (push/in_app)    │
│  ├─ Envia via WhatsApp (Meta/Evo)                │
│  ├─ Loga em automation_logs                      │
│  └─ Marca item como processado                   │
│                                                   │
│  Disparo manual:                                  │
│  ├─ Admin seleciona destinatários                │
│  ├─ Preview de mensagem de grupo editável        │
│  └─ Insere em automation_queue → mesmo fluxo     │
└─────────────────────────────────────────────────┘
```

## Etapas

### 1. Migração SQL

**Enum** `automation_trigger_type`:
`usuario_escalado`, `evento_proximo`, `substituicao_solicitada`, `substituicao_aprovada`, `presenca_pendente`, `evento_criado`

**Enum** `automation_channel`:
`whatsapp`, `push`, `email`, `in_app`

**Enum** `queue_status`:
`pendente`, `processando`, `enviado`, `erro`

**Tabela `automations`**:
- `id` uuid PK
- `company_id` uuid NOT NULL
- `name` text NOT NULL
- `type` text NOT NULL default 'automatica' (automatica/manual)
- `channel` automation_channel NOT NULL
- `trigger_event` automation_trigger_type nullable (null para manual)
- `active` boolean default true
- `message_template` text NOT NULL (com placeholders {{variavel}})
- `title_template` text NOT NULL
- `config_json` jsonb default '{}' (ex: horas_antes, filtros)
- `created_at` timestamptz

RLS: admin da company + super_admin

**Tabela `automation_queue`**:
- `id` uuid PK
- `company_id` uuid NOT NULL
- `automation_id` uuid nullable (null para disparo manual direto)
- `user_id` uuid NOT NULL (destinatário)
- `channel` automation_channel NOT NULL
- `title` text NOT NULL (já resolvido)
- `message` text NOT NULL (já resolvido)
- `metadata` jsonb default '{}'
- `status` queue_status default 'pendente'
- `error_message` text nullable
- `attempts` int default 0
- `created_at` timestamptz
- `processed_at` timestamptz nullable

RLS: admin da company SELECT, service_role ALL
Índice: `(status, created_at)` para processar pendentes

**Tabela `automation_logs`**:
- `id` uuid PK
- `company_id` uuid NOT NULL
- `automation_id` uuid nullable
- `queue_item_id` uuid nullable
- `user_id` uuid NOT NULL
- `channel` automation_channel NOT NULL
- `status` text NOT NULL (enviado/erro)
- `message` text NOT NULL
- `gateway_response` text nullable
- `created_at` timestamptz

RLS: admin da company SELECT + super_admin ALL

**Trigger `trg_process_automation_queue`**: AFTER INSERT on `automation_queue` chama `pg_net.http_post` para edge function `process-automation-queue` (habilitar extensão pg_net).

**Triggers de gatilho automático** (expandir existentes):
- `on_event_team_member_added` → além da notificação atual, inserir na `automation_queue` para automações com trigger `usuario_escalado`
- Novo trigger `on_event_created` → inserir na fila para trigger `evento_criado`
- Novo trigger `on_substitution_approved` → AFTER UPDATE em `event_substitutions` quando status muda para 'aprovado'

O trigger `schedule-reminders` existente será adaptado para também consultar automações com trigger `evento_proximo`.

### 2. Edge Function `process-automation-queue`

- Recebe webhook do pg_net (ou processa batch)
- Busca itens pendentes da fila (limit 50)
- Para cada item:
  - Marca como 'processando'
  - Envia conforme canal (reusa lógica do `send-notification` para push/in_app, WhatsApp direto)
  - Insere log em `automation_logs`
  - Marca como 'enviado' ou 'erro'
  - Incrementa attempts, max 3 retries

### 3. Função de resolução de template

Utilitário no edge function:
```
resolveTemplate(template, vars) → string
```
Substitui `{{evento_nome}}`, `{{data}}`, `{{hora}}`, `{{usuario_nome}}`, `{{funcao}}`, `{{equipe}}`.

### 4. Função de montagem de mensagem de grupo

Edge function ou utilitário que:
- Recebe `event_id`
- Busca teams + members agrupados
- Monta texto formatado:
```
📋 Evento: Missa Domingo 19h

📸 Foto:
- João
- Pedro

🎥 Vídeo:
- Lucas
```
- Retorna texto editável pelo admin antes do envio

### 5. Frontend — Expandir AdminNotifications

**Nova aba "Automações"**:
- Lista automações da company (nome, gatilho, canal, ativo)
- Toggle ativar/desativar
- Dialog criar/editar com: nome, tipo, canal, gatilho, template de título, template de mensagem, config (horas_antes etc)
- Preview do template com variáveis de exemplo

**Nova aba "Disparo Manual"** (expandir a existente "Enviar"):
- Seletor de destinatários: todos, por evento, por equipe, específicos
- Ao selecionar evento: botão "Montar mensagem de grupo" que chama a função e preenche o textarea
- Seletor de canal: in_app, push, whatsapp, todos
- Preview da mensagem
- Envia inserindo na `automation_queue`

**Nova aba "Logs"**:
- Tabela com: data, automação, destinatário, canal, status, mensagem
- Filtros: por canal, status, data

### 6. Hooks

- `useAutomations()` — CRUD de automações da company
- `useAutomationQueue()` — inserir na fila (disparo manual)
- `useAutomationLogs()` — listar logs com filtros

### 7. Trigger automático para mensagem de grupo

Novo trigger `on_event_teams_finalized` ou adaptar `on_event_team_member_added`:
- Quando membro é escalado, se existe automação `usuario_escalado` ativa, insere na fila com mensagem resolvida

## Detalhes Técnicos

| Arquivo | Ação |
|---------|------|
| Migration SQL | automations + automation_queue + automation_logs + triggers + pg_net |
| `supabase/functions/process-automation-queue/index.ts` | Edge function processadora da fila |
| `src/hooks/useAutomations.ts` | CRUD automações |
| `src/hooks/useAutomationQueue.ts` | Disparo manual + montagem grupo |
| `src/hooks/useAutomationLogs.ts` | Logs com filtros |
| `src/pages/admin/AdminNotifications.tsx` | + abas Automações, Logs, expandir Enviar |
| `src/components/notifications/AutomationList.tsx` | Lista + CRUD automações |
| `src/components/notifications/ManualDispatch.tsx` | Disparo manual com mensagem de grupo |
| `src/components/notifications/AutomationLogs.tsx` | Tabela de logs |

## Segurança

- Todas tabelas com RLS por company_id
- automation_queue: insert via trigger (SECURITY DEFINER) ou admin, processamento via service_role
- Deduplicação: unique constraint `(automation_id, user_id, channel, date_trunc('hour', created_at))` para evitar duplicatas na mesma hora
- Templates sanitizados (sem HTML/script injection)

## Ordem de implementação

1. Migração SQL (tabelas + enums + triggers pg_net)
2. Edge function `process-automation-queue`
3. Hooks (useAutomations, useAutomationQueue, useAutomationLogs)
4. UI: aba Automações (lista + CRUD)
5. UI: aba Disparo Manual (com montagem de grupo)
6. UI: aba Logs
7. Triggers automáticos nos eventos existentes

