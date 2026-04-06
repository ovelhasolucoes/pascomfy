---
name: Frontend de Eventos e Escalas
description: Páginas e componentes React para calendário, criação, detalhe de eventos, gestão de equipes/escala, agenda pessoal e admin settings
type: feature
---

## Rotas
- `/events` — Calendário mensal com filtros por tipo e status
- `/events/new` — Criação de evento (permissão `criar_evento`)
- `/events/:id` — Detalhe do evento com gestão de equipes e escala
- `/my-schedule` — Agenda pessoal do usuário com confirmação de presença
- `/admin/event-settings` — CRUD de event_types e team_templates (admin)
- `/admin/users` — Gestão de usuários (admin)

## Hooks
- `useEvents` — CRUD eventos com filtros (month, year, typeId, status)
- `useEventTeams(eventId)` — Equipes com membros (join profiles)
- `useEventMembers(eventId)` — Add/update/remove membros, confirmar presença
- `useEventTypes` — Listar tipos da company
- `useTeamTemplates` — Listar templates da company
- `useCompanyMembers` — Profiles ativos para dropdown de escalação
- `useMySchedule` — Eventos futuros onde usuário está escalado

## Layout
- `AppLayout` — SidebarProvider + Sidebar + header com SidebarTrigger
- `AppSidebar` — Links condicionais (admin items só para isAdmin)

## Componentes de Eventos
- `EventCalendar` — Grid mensal desktop, lista mobile
- `EventFilters` — Selects de tipo e status
- `EventForm` — Formulário completo com datepicker
- `EventTeamCard` — Card de equipe com membros
- `TeamMemberRow` — Membro com status select (canEdit) ou badge
- `AddMemberDialog` — Select de profiles + campo função
- `AddTeamDialog` — Tabs: template ou manual
