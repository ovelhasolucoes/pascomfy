

# Pascomfy — Checklist e Presença (Backend)

## Resumo

Uma migração SQL criando 6 tabelas (checklist templates, itens de template, checklists por evento, itens do checklist, progresso, e presença), com enums, índices, RLS policies e preparação para realtime/gamificação.

## Enums

- `checklist_status`: pendente, concluido
- `attendance_status`: presente, ausente

## Tabelas

### `checklist_templates`
- `id` uuid PK, `company_id` FK→companies, `name` text, `description` text nullable, `created_by` uuid FK→auth.users, `created_at` timestamptz
- RLS: SELECT membros da company; INSERT/UPDATE/DELETE admin da company; ALL super_admin

### `checklist_template_items`
- `id` uuid PK, `template_id` FK→checklist_templates ON DELETE CASCADE, `title` text, `description` text nullable, `display_order` int default 0, `is_required` boolean default false, `created_at`
- RLS: SELECT membros da company (via join com template); INSERT/UPDATE/DELETE admin; ALL super_admin
- Problema: `company_id` ausente dificulta RLS. Solução: adicionar `company_id` diretamente na tabela (desnormalizado, padrão multi-tenant).

### `event_checklists`
- `id` uuid PK, `company_id` FK→companies, `event_id` FK→events ON DELETE CASCADE, `event_team_id` FK→event_teams nullable ON DELETE SET NULL, `template_id` FK→checklist_templates nullable (referência apenas informativa — dados são copiados), `name` text, `created_at`
- Index: (event_id), (company_id)
- RLS: SELECT membros da company; INSERT/UPDATE/DELETE permissão `editar_escala`; ALL super_admin

### `event_checklist_items`
- `id` uuid PK, `company_id` FK→companies, `event_checklist_id` FK→event_checklists ON DELETE CASCADE, `title` text, `description` text nullable, `display_order` int default 0, `is_required` boolean default false, `created_at`
- Index: (event_checklist_id)
- RLS: SELECT membros da company; INSERT/UPDATE/DELETE permissão `editar_escala`; ALL super_admin

### `event_checklist_progress`
- `id` uuid PK, `company_id` FK→companies, `event_checklist_item_id` FK→event_checklist_items ON DELETE CASCADE, `user_id` FK→profiles(id), `status` checklist_status default 'pendente', `completed_at` timestamptz nullable, `created_at`
- unique(event_checklist_item_id, user_id)
- Indexes: (user_id, company_id), (event_checklist_item_id)
- RLS: SELECT membros da company; INSERT/UPDATE próprio registro (user_id = auth.uid()); ALL super_admin

### `event_attendance`
- `id` uuid PK, `company_id` FK→companies, `event_id` FK→events ON DELETE CASCADE, `user_id` FK→profiles(id), `status` attendance_status default 'presente', `checkin_at` timestamptz default now(), `created_at`
- unique(event_id, user_id) — impede duplicidade
- Indexes: (event_id, company_id), (user_id)
- RLS: SELECT membros da company; INSERT próprio registro; UPDATE próprio registro; ALL super_admin

## RLS — Resumo

```text
checklist_templates / checklist_template_items:
  SELECT  → is_active_user + company_id match
  ALL     → admin da company OU super_admin

event_checklists / event_checklist_items:
  SELECT  → is_active_user + company_id match
  ALL     → check_user_permission('editar_escala') + company_id match
  ALL     → super_admin

event_checklist_progress:
  SELECT  → is_active_user + company_id match
  INSERT  → user_id = auth.uid() + company_id match
  UPDATE  → user_id = auth.uid() + company_id match
  ALL     → super_admin

event_attendance:
  SELECT  → is_active_user + company_id match
  INSERT  → user_id = auth.uid() + company_id match (unique constraint impede duplicidade)
  UPDATE  → user_id = auth.uid() (pode alterar status)
  ALL     → super_admin
```

## Queries de Exemplo

1. **Checklist de um usuário no evento:**
```sql
SELECT eci.title, eci.is_required, ecp.status, ecp.completed_at
FROM event_checklist_items eci
JOIN event_checklists ec ON ec.id = eci.event_checklist_id
LEFT JOIN event_checklist_progress ecp 
  ON ecp.event_checklist_item_id = eci.id AND ecp.user_id = :user_id
WHERE ec.event_id = :event_id
ORDER BY eci.display_order;
```

2. **Progresso do evento (percentual):**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ecp.status = 'concluido') as done,
  ROUND(COUNT(*) FILTER (WHERE ecp.status = 'concluido') * 100.0 / NULLIF(COUNT(*), 0)) as pct
FROM event_checklist_items eci
JOIN event_checklists ec ON ec.id = eci.event_checklist_id
LEFT JOIN event_checklist_progress ecp ON ecp.event_checklist_item_id = eci.id
WHERE ec.event_id = :event_id;
```

3. **Presença do evento:**
```sql
SELECT p.name, ea.status, ea.checkin_at
FROM event_attendance ea
JOIN profiles p ON p.id = ea.user_id
WHERE ea.event_id = :event_id
ORDER BY ea.checkin_at;
```

## Preparação Realtime
- Habilitar `ALTER PUBLICATION supabase_realtime ADD TABLE event_checklist_progress, event_attendance;` na migração
- Frontend poderá usar `supabase.channel().on('postgres_changes', ...)` para atualizações ao vivo

## Preparação Gamificação
- `event_checklist_progress` tem `completed_at` para calcular pontos por tarefa
- `event_attendance` tem `checkin_at` para pontuar presença
- Futuro: tabela `user_points` que soma pontos de ambas fontes

## Ordem de Execução
1. Migração SQL (enums, tabelas, índices, RLS, realtime)
2. Atualizar memória do projeto

