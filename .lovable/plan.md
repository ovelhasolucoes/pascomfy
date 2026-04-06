

# Pascomfy — Telas Operacionais: Checklist, Presença e Modo ao Vivo

## Resumo

Criação de hooks e componentes para execução de checklist (híbrido: individual + compartilhado), check-in com janela de tempo, e modo "Missa ao Vivo" com Supabase Realtime. Mobile-first, botões grandes, feedback visual.

## Estrutura de Arquivos

```text
src/
  hooks/
    useEventChecklist.ts      — fetch checklists + itens + progresso do evento
    useChecklistProgress.ts   — marcar/desmarcar itens (insert/update progress)
    useEventAttendance.ts     — check-in do usuário + listagem
    useRealtimeChecklist.ts   — subscribe Realtime em progress + attendance
  components/
    checklist/
      ChecklistSection.tsx    — seção com lista de checklists do evento
      ChecklistItemRow.tsx    — linha de item com checkbox grande + animação
      ChecklistProgressBar.tsx — barra de progresso percentual
    attendance/
      AttendanceButton.tsx    — botão grande de check-in com estado
      AttendanceList.tsx      — lista de presenças (admin view)
    live/
      LiveModeView.tsx        — tela simplificada (checklist + presença apenas)
  pages/
    EventLivePage.tsx         — rota /events/:id/live (modo foco)
```

## Rotas Novas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/events/:id/live` | EventLivePage | Modo Missa ao Vivo |

## Implementação

### 1. Hooks de Dados

**useEventChecklist(eventId)**
- Fetch `event_checklists` com `event_checklist_items` e `event_checklist_progress` via joins
- Cada item indica `scope`: `individual` ou `shared` (campo a adicionar via migração na tabela `event_checklist_items`)
- Retorna checklists agrupados com itens e progresso calculado

**useChecklistProgress(eventId)**
- `toggleItem(itemId)`: se scope=individual, insert/update com `user_id = auth.uid()`; se scope=shared, qualquer membro escalado pode marcar
- Invalidate query on success

**useEventAttendance(eventId)**
- `checkIn()`: insert em `event_attendance` com `user_id`, `company_id`, `event_id`
- Validação no frontend: check-in só liberado se `event.start_date - X horas <= now()` (X = 2h por padrão, configurável futuramente)
- `attendance`: lista de check-ins do evento
- `myAttendance`: check-in do usuário logado (para mostrar status)

**useRealtimeChecklist(eventId)**
- Subscribe em `event_checklist_progress` e `event_attendance` filtrado por `event_id` (via company_id index)
- On change: invalidate React Query cache para refetch automático

### 2. Migração SQL

Adicionar coluna `scope` em `event_checklist_items`:
```sql
ALTER TABLE event_checklist_items 
ADD COLUMN scope text NOT NULL DEFAULT 'shared' 
CHECK (scope IN ('individual', 'shared'));
```

Atualizar RLS de `event_checklist_progress` para permitir que qualquer membro escalado marque itens `shared`:
- Nova policy: INSERT/UPDATE para itens shared se user está escalado no evento (via join `event_checklist_items → event_checklists → events → event_teams → event_team_members`)

### 3. Componentes UI

**ChecklistItemRow**
- Checkbox grande (48x48px touch target)
- Título + descrição colapsável
- Badge "Obrigatório" se `is_required`
- Badge "Individual" ou "Equipe" baseado no scope
- Animação: scale + cor verde ao completar (transition 200ms)
- Se shared e já marcado por outro: mostra "Concluído por [nome]"

**ChecklistProgressBar**
- Usa componente Progress existente
- Label: "X de Y concluídos (Z%)"

**AttendanceButton**
- Estado 1: botão primário grande "Confirmar Presença" (desabilitado se fora da janela)
- Estado 2: "✅ Presente — HH:mm" (após check-in)
- Se fora da janela: texto "Check-in disponível em X horas"

**LiveModeView**
- Fundo escuro, sem sidebar, sem header complexo
- Apenas: título do evento + checklist + botão presença
- Botão "Sair do modo foco" (volta para `/events/:id`)

### 4. Integração na EventDetailPage

Adicionar duas seções abaixo de "Equipes & Escala":
- **Checklist**: `<ChecklistSection eventId={id} />`
- **Presença**: `<AttendanceButton eventId={id} />` + `<AttendanceList>` (se admin)
- Botão "Modo Foco" que navega para `/events/:id/live`

### 5. Visão Admin

Dentro de EventDetailPage (condicional `isAdmin || canEditScale`):
- Tab ou seção "Painel" com:
  - Lista de membros escalados + status de presença
  - Progresso do checklist por membro (itens individuais) e geral (itens shared)

## Detalhes Técnicos

- Realtime: `supabase.channel('event-live-' + eventId).on('postgres_changes', { event: '*', schema: 'public', table: 'event_checklist_progress', filter: 'company_id=eq.' + companyId })` — invalida queries
- Janela de check-in: validação frontend (2h antes do `start_date`). Sem enforcement no backend por enquanto (RLS já garante `user_id = auth.uid()`)
- Touch targets: min 44px height em todos os interativos
- Animações: usar classes `animate-scale-in` existentes no tailwind config

## Ordem de Execução

1. Migração SQL (scope em event_checklist_items + RLS update)
2. Hooks (useEventChecklist, useChecklistProgress, useEventAttendance, useRealtimeChecklist)
3. Componentes checklist (ItemRow, ProgressBar, Section)
4. Componente attendance (Button, List)
5. Integrar na EventDetailPage
6. LiveModeView + rota /events/:id/live
7. Atualizar memória do projeto

