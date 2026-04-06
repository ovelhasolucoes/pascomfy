

# Pascomfy — Sistema de Eventos e Escalas

## Resumo

Criação do núcleo operacional do sistema: eventos, equipes, escalas e funções individuais. Inclui tabela dinâmica de tipos de evento, templates reutilizáveis de equipe e visibilidade híbrida (calendário geral + agenda pessoal).

## Estrutura de Tabelas

### `event_types` — Tipos dinâmicos por company
- `id` uuid PK, `company_id` FK→companies, `name` text, `color` text nullable, `icon` text nullable, `created_at`
- unique(company_id, name)
- RLS: SELECT para membros da company; INSERT/UPDATE/DELETE para admin da company; ALL para super_admin

### `team_templates` — Templates de equipe reutilizáveis
- `id` uuid PK, `company_id` FK→companies, `name` text, `description` text nullable, `color` text nullable, `display_order` int default 0, `created_at`
- unique(company_id, name)
- RLS: SELECT para membros da company; INSERT/UPDATE/DELETE para admin; ALL para super_admin

### `events` — Eventos
- `id` uuid PK, `company_id` FK→companies, `title` text, `description` text nullable, `event_type_id` FK→event_types nullable, `start_date` timestamptz, `end_date` timestamptz nullable, `location` text nullable, `status` enum `event_status` (ativo, cancelado) default 'ativo', `created_by` uuid FK→auth.users, `created_at`
- Indexes: (company_id, start_date), (company_id, status)
- RLS: SELECT para membros ativos da company; INSERT/UPDATE/DELETE com permissão `criar_evento`; ALL para super_admin

### `event_teams` — Equipes do evento
- `id` uuid PK, `company_id` FK→companies, `event_id` FK→events ON DELETE CASCADE, `template_id` FK→team_templates nullable, `name` text, `description` text nullable, `color` text nullable, `display_order` int default 0, `created_at`
- Index: (event_id)
- RLS: SELECT para membros da company; INSERT/UPDATE/DELETE com permissão `editar_escala`; ALL para super_admin

### `event_team_members` — Escala (membros + funções)
- `id` uuid PK, `company_id` FK→companies, `event_team_id` FK→event_teams ON DELETE CASCADE, `user_id` FK→profiles(id), `status` enum `member_status` (pendente, confirmado, ausente, substituido) default 'pendente', `role_name` text nullable (nome da função: "foto do altar"), `role_description` text nullable, `confirmed_at` timestamptz nullable, `created_at`
- unique(event_team_id, user_id)
- Indexes: (user_id, company_id), (event_team_id)
- RLS: SELECT para membros da company; UPDATE próprio registro (para confirmar presença); INSERT/DELETE com permissão `editar_escala`; ALL para super_admin

## Enums
- `event_status`: ativo, cancelado
- `member_status`: pendente, confirmado, ausente, substituido

## Migração SQL (uma única migração)
Criação de enums, tabelas, índices, foreign keys e RLS policies. Seed de event_types padrão (missa, procissão, reunião, celebração, retiro) e team_templates padrão (Foto, Vídeo, Stories, Transmissão, Som) — via insert tool após a migração.

## Policies RLS — Resumo

```text
event_types / team_templates:
  SELECT  → is_active_user + company_id match
  ALL     → admin da company OU super_admin

events:
  SELECT  → is_active_user + company_id match (visão geral)
  INSERT  → check_user_permission('criar_evento')
  UPDATE  → check_user_permission('criar_evento') + company_id match
  DELETE  → admin da company OU super_admin

event_teams:
  SELECT  → is_active_user + company_id match
  INSERT/UPDATE/DELETE → check_user_permission('editar_escala') + company_id match

event_team_members:
  SELECT  → is_active_user + company_id match
  UPDATE  → user_id = auth.uid() (auto-confirmação) OU check_user_permission('editar_escala')
  INSERT/DELETE → check_user_permission('editar_escala') + company_id match
```

## Queries Preparadas (exemplos no frontend)

1. **Agenda pessoal** — eventos onde o usuário está escalado:
```sql
SELECT e.* FROM events e
JOIN event_teams et ON et.event_id = e.id
JOIN event_team_members etm ON etm.event_team_id = et.id
WHERE etm.user_id = auth.uid()
AND e.start_date >= now()
ORDER BY e.start_date;
```

2. **Calendário da company** — todos os eventos ativos:
```sql
SELECT * FROM events
WHERE status = 'ativo' AND start_date >= now()
ORDER BY start_date;
```

3. **Escala de um evento** — equipes + membros + funções:
```sql
SELECT et.name as team, p.name as member, etm.role_name, etm.status
FROM event_teams et
JOIN event_team_members etm ON etm.event_team_id = et.id
JOIN profiles p ON p.id = etm.user_id
WHERE et.event_id = :event_id
ORDER BY et.display_order, p.name;
```

## Frontend (páginas a criar)

Nesta fase, foco apenas na migração e seed. Páginas de UI serão implementadas em uma fase seguinte:
- Calendário de eventos
- Criação/edição de evento com seleção de equipes via templates
- Tela de escala com drag-and-drop de membros
- Agenda pessoal do usuário com confirmação de presença

## Ordem de Execução

1. Migração SQL (enums, tabelas, índices, RLS)
2. Seed de event_types e team_templates padrão via insert tool
3. Atualizar memória do projeto

## Detalhes Técnicos

```text
Fluxo de criação de evento:
  Admin → Cria evento (tipo, data, local)
       → Seleciona templates de equipe → copia para event_teams
       → Escala membros em cada equipe com função específica
       → Membros recebem status "pendente"
       → Membros confirmam presença → status "confirmado" + confirmed_at

Visibilidade híbrida:
  Calendário geral: todos os eventos da company (SELECT via RLS company_id)
  Agenda pessoal: filtro no frontend via JOIN com event_team_members.user_id
```

