---
name: Checklist e Presença
description: Tabelas de checklist templates, checklists por evento, progresso individual e presença/check-in com RLS multi-tenant e realtime
type: feature
---

## Enums
- `checklist_status`: pendente, concluido
- `attendance_status`: presente, ausente

## Tabelas
- `checklist_templates` — Templates reutilizáveis por company (name, description, created_by)
- `checklist_template_items` — Itens do template (title, description, display_order, is_required, company_id desnormalizado)
- `event_checklists` — Checklists vinculados a evento/equipe, dados copiados do template (event_id, event_team_id opcional, template_id referência)
- `event_checklist_items` — Itens do checklist do evento (title, description, display_order, is_required)
- `event_checklist_progress` — Progresso individual: unique(item_id, user_id), status pendente/concluido, completed_at
- `event_attendance` — Presença: unique(event_id, user_id), status presente/ausente, checkin_at

## RLS
- Templates: SELECT membros company, ALL admin/super_admin
- Event checklists/items: SELECT membros company, ALL permissão editar_escala + super_admin
- Progress: SELECT company, INSERT/UPDATE próprio user_id, ALL super_admin
- Attendance: SELECT company, INSERT/UPDATE próprio user_id, ALL super_admin

## Realtime
- `event_checklist_progress` e `event_attendance` adicionados à publication supabase_realtime

## Gamificação (futuro)
- completed_at e checkin_at preparados para cálculo de pontos
