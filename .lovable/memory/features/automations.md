---
name: Automation system
description: Multi-channel automation with queue, triggers, edge function processing, manual dispatch with group message builder
type: feature
---

## Tables
- `automations` — rules with trigger_event + channel + message_template with {{variables}}
- `automation_queue` — send queue processed via pg_net webhook → edge function `process-automation-queue`
- `automation_logs` — delivery logs per channel/status

## Enums
- `automation_trigger_type`: usuario_escalado, evento_proximo, substituicao_solicitada, substituicao_aprovada, presenca_pendente, evento_criado
- `automation_channel`: whatsapp, push, email, in_app
- `queue_status`: pendente, processando, enviado, erro

## Triggers (SQL)
- `trg_enqueue_on_team_member_added` — fires automations with trigger `usuario_escalado`
- `trg_enqueue_on_event_created` — fires `evento_criado` automations to admins
- `trg_enqueue_on_substitution_approved` — fires `substituicao_aprovada` to user
- `trg_process_automation_queue` — calls edge function via pg_net on queue insert

## Template Variables
`{{evento_nome}}`, `{{data}}`, `{{hora}}`, `{{usuario_nome}}`, `{{funcao}}`, `{{equipe}}`

## UI
Located in `/admin/notifications` with tabs: Automações, Disparo Manual, Logs, Preferências

## Group Message Builder
`useAutomationQueue.buildGroupMessage(eventId)` — builds formatted team roster message from event_teams/members
