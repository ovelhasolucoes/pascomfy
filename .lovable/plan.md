

# Pascomfy — Frontend de Eventos e Escalas

## Resumo

Construção de 6 telas/componentes principais para gestão de eventos, equipes e escalas, com integração Supabase, design responsivo e navegação via sidebar/tabs.

## Estrutura de Arquivos

```text
src/
  components/
    layout/
      AppSidebar.tsx          — sidebar com navegação principal
      AppLayout.tsx            — layout wrapper (sidebar + content)
    events/
      EventCalendar.tsx        — calendário mensal com eventos coloridos
      EventList.tsx            — lista de eventos (fallback mobile)
      EventFilters.tsx         — filtros por tipo e equipe
      EventForm.tsx            — formulário criar/editar evento
      EventDetail.tsx          — modal/sheet com detalhes do evento
      EventTeamCard.tsx        — card de equipe dentro do evento
      TeamMemberRow.tsx        — linha de membro com função e status
      AddMemberDialog.tsx      — dialog para adicionar membro à equipe
      AddTeamDialog.tsx        — dialog para criar equipe no evento
    schedule/
      MySchedule.tsx           — agenda pessoal do usuário
      ConfirmPresenceButton.tsx — botão confirmar presença
  hooks/
    useEvents.ts               — CRUD de eventos
    useEventTeams.ts           — CRUD de equipes do evento
    useEventMembers.ts         — CRUD de membros da equipe
    useEventTypes.ts           — listar/criar event_types
    useTeamTemplates.ts        — listar team_templates
    useCompanyMembers.ts       — listar profiles da company
  pages/
    Events.tsx                 — página principal (calendário + filtros)
    EventDetailPage.tsx        — página de detalhe do evento
    EventCreate.tsx            — página de criação de evento
    MySchedulePage.tsx         — agenda pessoal
    admin/
      EventSettings.tsx        — gestão de tipos e templates (admin)
```

## Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/events` | Events | Autenticado |
| `/events/new` | EventCreate | Permissão `criar_evento` |
| `/events/:id` | EventDetailPage | Autenticado |
| `/my-schedule` | MySchedulePage | Autenticado |
| `/admin/event-settings` | EventSettings | Admin |

A rota `/` (Index) será atualizada para redirecionar para `/events` ou incluir links de navegação.

## Implementação por Etapa

### Etapa 1: Layout e Navegação
- `AppLayout` com sidebar colapsável (shadcn Sidebar)
- Links: Eventos, Minha Agenda, Admin (condicional)
- Substituir layout atual do Index

### Etapa 2: Hooks de Dados
- `useEvents`: fetch events com join em event_types, filtros por data/tipo/status
- `useEventTeams`: fetch/create/delete equipes de um evento, com join em members
- `useEventMembers`: add/remove/update membros, confirmar presença
- `useEventTypes`: listar tipos da company
- `useTeamTemplates`: listar templates da company
- `useCompanyMembers`: listar profiles ativos da company (para dropdown de escalação)
- Todos usam `useProfile` para obter `company_id` automaticamente

### Etapa 3: Calendário de Eventos
- Grid mensal com dias, eventos posicionados por `start_date`
- Cor do evento = cor do `event_type`
- Clicar no evento navega para `/events/:id`
- Filtros: dropdown de tipo, dropdown de equipe
- Botão "Novo Evento" (visível com permissão `criar_evento`)
- Mobile: exibe lista ao invés de grid

### Etapa 4: Criação de Evento
- Formulário com: título, descrição, tipo (select de event_types), data início/fim (datepicker), local
- `company_id` e `created_by` preenchidos automaticamente
- Após salvar, redireciona para `/events/:id` para montar equipes

### Etapa 5: Detalhe do Evento + Equipes + Escala
- Header com info do evento (título, tipo, data, local, status)
- Lista de equipes como cards
- Cada card mostra membros com: nome, função (`role_name`), status (badge colorido)
- Botão "Adicionar Equipe" — dialog com nome, descrição, cor, ou selecionar template
- Botão "Adicionar Membro" por equipe — dialog com select de profiles + campo função
- Ações por membro: editar função, alterar status, remover
- Permissão `editar_escala` controla visibilidade dos botões de ação

### Etapa 6: Agenda Pessoal
- Lista de eventos futuros onde o usuário está escalado (join event_team_members → event_teams → events)
- Cards com: título, data, equipe, função, status
- Botão "Confirmar Presença" (atualiza status para `confirmado` + `confirmed_at`)
- Destaque visual para eventos próximos (< 48h)

### Etapa 7: Admin — Tipos e Templates
- Tabs: "Tipos de Evento" | "Templates de Equipe"
- CRUD simples com tabela + dialog de criação
- Campos tipo: nome, cor, ícone
- Campos template: nome, descrição, cor, ordem

## Detalhes Técnicos

- Queries usam `company_id` do profile logado; RLS garante isolamento
- Datepicker usa shadcn Calendar com `pointer-events-auto`
- React Query (`@tanstack/react-query`) para cache e refetch
- Filtros de calendário via query params na URL
- Status dos membros mapeados para cores: pendente=amarelo, confirmado=verde, ausente=vermelho, substituido=cinza
- Mobile-first: calendário vira lista, equipes empilham verticalmente

## Ordem de Execução

1. Layout (sidebar + rotas)
2. Hooks de dados (useEvents, useEventTeams, useEventMembers, etc.)
3. Calendário + filtros
4. Criação de evento
5. Detalhe do evento + gestão de equipes e escala
6. Agenda pessoal
7. Admin de tipos/templates
8. Atualizar memória do projeto

