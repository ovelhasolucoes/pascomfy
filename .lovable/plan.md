

# Perfil, Substituição, Gamificação e Dashboard Unificado

## Resumo

Implementar 6 módulos: expansão do perfil do usuário, sistema de substituição com aprovação, gamificação automática via triggers, ranking, dashboard unificado (colaborador + admin na mesma rota), e configurações da company via `companies.settings`.

## Arquitetura

```text
┌─────────────────────────────────────────────────┐
│  / (home) → Dashboard Unificado                │
│  ├─ Colaborador: próximos eventos, pontos,      │
│  │   ranking, tarefas pendentes                 │
│  └─ Admin: + equipe incompleta, mais ativos,    │
│       mais faltas, status geral                 │
│                                                 │
│  /profile → Edição de perfil expandido          │
│  /my-schedule → + botão "Solicitar substituição"│
│                                                 │
│  Triggers automáticos no banco:                 │
│  ├─ checkin → +pontos presença                  │
│  ├─ checklist completo → +pontos checklist      │
│  └─ falta registrada → penalidade               │
│                                                 │
│  companies.settings (jsonb) armazena:           │
│  ├─ tempo_limite_substituicao (horas)           │
│  ├─ gamificacao_ativa (boolean)                 │
│  ├─ pontos_presenca, pontos_checklist           │
│  └─ penalidade_falta                            │
└─────────────────────────────────────────────────┘
```

## Etapas

### 1. Migração SQL — Perfil + Substituições + Gamificação

**Perfil** — adicionar colunas à `profiles`:
- `bio` text nullable
- `skills` jsonb default '[]' (habilidades)
- `preferred_roles` jsonb default '[]' (funções preferidas)

Reaproveitar: `phone` como whatsapp, `avatar_url` como foto, `availability` como disponibilidade, `settings` como preferências.

**Substituições** — nova tabela `event_substitutions`:
- `id` uuid PK
- `company_id` uuid NOT NULL
- `event_id` uuid NOT NULL
- `event_team_member_id` uuid NOT NULL (quem pediu)
- `user_id` uuid NOT NULL (quem pediu)
- `reason` text NOT NULL
- `status` enum `substitution_status` (pendente, aprovado, rejeitado)
- `responded_by` uuid nullable
- `responded_at` timestamptz nullable
- `replacement_user_id` uuid nullable (quem substituiu)
- `created_at` timestamptz default now()

RLS: user vê/cria as próprias, admin gerencia da company, super_admin tudo.

**Gamificação** — novas tabelas:

`gamification_points`:
- `id`, `company_id`, `user_id`, `points` int, `source` text (presenca/checklist/falta), `source_id` uuid nullable, `created_at`

`gamification_levels`:
- `id`, `company_id`, `name` text, `min_points` int, `icon` text nullable, `created_at`

RLS: members veem da company, admin gerencia, super_admin tudo.

**Triggers automáticos**:
- `on_attendance_insert` → insere +pontos (lê `companies.settings->pontos_presenca`, default 10)
- `on_checklist_complete` → insere +pontos ao marcar item como concluído (default 5)
- Penalidade de falta: via cron ou edge function (não trigger, pois falta é ausência)

**Índices**: `event_substitutions(event_id, user_id)`, `gamification_points(company_id, user_id)`, `gamification_points(source, source_id)`

### 2. Tela de Perfil (`/profile`)

Nova página `src/pages/ProfilePage.tsx`:
- Avatar com upload (reusa lógica do WhiteLabelSettings)
- Nome, e-mail (readonly), telefone/whatsapp, bio
- Habilidades como tags editáveis
- Funções preferidas como tags
- Disponibilidade semanal (grid de dias/turnos) — reusa `availability` jsonb
- Salva em `profiles`

Adicionar link "Meu Perfil" no sidebar (seção Principal) e no footer do sidebar (clique no avatar).

### 3. Sistema de Substituição

**Hook** `useSubstitutions.ts`:
- Solicitar substituição (verifica tempo limite via `companies.settings`)
- Listar substituições do user
- Admin: listar da company, aprovar/rejeitar, atribuir substituto

**UI** — Botão "Pedir substituição" na `MySchedulePage` ao lado de cada evento:
- Só aparece se faltam > X horas (configurável)
- Modal com campo motivo
- Badge de status (pendente/aprovado/rejeitado)

**Admin** — Nova seção em `/events/:id` ou lista em `/admin/substitutions`:
- Lista de pedidos pendentes
- Ações: aprovar + selecionar substituto, rejeitar

### 4. Gamificação + Ranking

**Hook** `useGamification.ts`:
- Pontos do user atual
- Ranking da company (top N)
- Level atual do user

**Componentes**:
- `PointsBadge` — mostra pontos + level do user
- `RankingList` — lista com posição, nome, pontos, level
- Usado no dashboard

**Admin Settings** — Nova aba "Gamificação" em `/admin/settings`:
- Toggle gamificação ativa
- Inputs: pontos por presença, por checklist, penalidade falta
- Gerenciar níveis (nome + pontos mínimos)
- Tudo salvo em `companies.settings`

### 5. Dashboard Unificado (`/`)

Substituir a rota `/` que hoje redireciona para `/events`.

Nova página `src/pages/DashboardPage.tsx`:

**Para todos (colaborador)**:
- Card: próximos eventos (query `useMySchedule`)
- Card: tarefas pendentes (checklists não concluídos)
- Card: meus pontos + level (se gamificação ativa)
- Card: ranking top 5 (se gamificação ativa)
- Card: substituições pendentes

**Adicional para admin**:
- Card: eventos próximos sem equipe completa
- Card: top 5 mais ativos
- Card: top 5 mais faltas
- Card: resumo geral (total users, eventos mês, etc)

Layout responsivo com grid de cards.

### 6. Configurações da Company (via settings jsonb)

Adicionar aba "Geral" ou expandir aba "Empresa" em AdminSettings com:
- `tempo_limite_substituicao`: input numérico (default 24h)
- `gamificacao_ativa`: toggle
- `pontos_presenca`: input (default 10)
- `pontos_checklist`: input (default 5)
- `penalidade_falta`: input (default -15)
- `notificacoes_ativas`: toggle (já existe parcialmente)

Salva no campo `companies.settings` via update.

## Detalhes Técnicos

| Arquivo | Ação |
|---------|------|
| Migration SQL | profiles + event_substitutions + gamification_* + triggers |
| `src/pages/DashboardPage.tsx` | Dashboard unificado (novo) |
| `src/pages/ProfilePage.tsx` | Edição de perfil (novo) |
| `src/hooks/useSubstitutions.ts` | Hook substituições (novo) |
| `src/hooks/useGamification.ts` | Hook gamificação + ranking (novo) |
| `src/hooks/useDashboardStats.ts` | Hook stats do dashboard (novo) |
| `src/pages/MySchedulePage.tsx` | + botão substituição |
| `src/pages/admin/AdminSettings.tsx` | + aba Gamificação |
| `src/components/layout/AppSidebar.tsx` | + links Dashboard, Perfil |
| `src/App.tsx` | Rotas: /, /profile, ajustes |

## Segurança

- Todas novas tabelas com RLS por `company_id` usando `get_user_company_id()`
- Substituição: user só cria/vê as próprias; admin da company gerencia
- Gamification points: insert apenas via trigger (SECURITY DEFINER), user só lê
- Ranking público dentro da company (members veem)
- Settings da company: só admin atualiza

## Ordem de implementação sugerida

1. Migração SQL (tudo junto)
2. Perfil do usuário
3. Configurações da company (settings jsonb)
4. Gamificação + triggers + ranking
5. Sistema de substituição
6. Dashboard unificado

