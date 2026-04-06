

# Refinamento UX/UI Completo — Fase 1

## Resumo

Refinar Layout + Sidebar + Header, Dashboard + Perfil, e Eventos + Escala + Checklist. Adicionar dark mode com toggle, animacoes ricas, skeleton loaders, e padronizacao visual moderna.

## Escopo (3 grupos priorizados)

### Grupo 1: Fundacao (Layout, Theme, Animacoes)
### Grupo 2: Dashboard + Perfil
### Grupo 3: Eventos + Escala + Agenda

---

## Etapas

### 1. Sistema de Tema (Dark Mode + Cores Refinadas)

**`src/index.css`**: Refinar paleta light e dark. Adicionar variaveis `--success`, `--warning`, `--chart-1..5` para consistencia visual. Cores mais vibrantes e modernas (inspiracao Linear/Notion).

**`src/components/ThemeToggle.tsx`**: Novo componente com icone sol/lua, persiste em `localStorage`, aplica classe `dark` no `<html>`.

**`tailwind.config.ts`**: Adicionar keyframes para `fade-in`, `slide-up`, `scale-in`, `slide-in-right`. Adicionar cores `success` e `warning` no extend.

### 2. Layout Global Refinado

**`src/components/layout/AppLayout.tsx`**:
- Header com blur mais forte, sombra sutil
- Adicionar `ThemeToggle` ao header
- Breadcrumb simples baseado na rota atual
- Animacao fade-in no `<main>` ao trocar de pagina

**`src/components/layout/AppSidebar.tsx`**:
- Refinar espacamentos e hover states
- Adicionar badge de contagem no item "Notificacoes" (notificacoes nao lidas)
- Footer com card do usuario mais polido
- Transicao suave no collapse/expand

### 3. Componentes Base Melhorados

**`src/components/ui/skeleton-card.tsx`** (novo): Componente reutilizavel de skeleton para cards do dashboard, listas de eventos, etc.

**`src/components/ui/page-header.tsx`** (novo): Componente padrao para header de pagina (titulo, descricao, acoes). Substitui os `<div>` repetidos em todas as paginas. Inclui animacao `fade-in`.

**`src/components/ui/empty-state.tsx`** (novo): Componente para estados vazios com icone, titulo, descricao e CTA. Substitui os `<p>` simples.

**`src/components/ui/stat-card.tsx`** (novo): Card de estatistica padronizado com icone, valor, label, trend indicator opcional, animacao `scale-in` no mount.

### 4. Dashboard Refinado

**`src/pages/DashboardPage.tsx`**:
- Usar `PageHeader` com saudacao contextual (bom dia/boa tarde/boa noite)
- Usar `StatCard` para os cards de metricas (com animacao staggered)
- Usar `SkeletonCard` durante loading
- Usar `EmptyState` para listas vazias
- Cards com hover sutil (`hover:shadow-md transition-shadow`)
- Ranking com animacao de entrada por item (stagger 50ms)
- Grafico com cores do tema (usar variaveis CSS)

### 5. Perfil Refinado

**`src/pages/ProfilePage.tsx`**:
- Usar `PageHeader`
- Avatar maior com overlay de upload mais elegante (gradiente semi-transparente)
- Cards com bordas mais suaves
- Disponibilidade: botoes maiores em mobile (min-h-10), com cores verde/cinza mais claras
- Animacao fade-in nos cards ao scroll
- Skeleton loader durante carregamento
- Botao salvar fixo no bottom em mobile (`sticky bottom-0`)

### 6. Eventos Refinados

**`src/components/events/EventCalendar.tsx`**:
- Calendario desktop: hover nos dias com sombra sutil
- Eventos com tooltip ao hover (titulo + hora completa)
- Mobile: cards com mais destaque visual, sombra, e badge de tipo
- Transicao suave ao trocar de mes (fade)
- Skeleton grid durante loading

**`src/pages/EventDetailPage.tsx`**:
- Header do evento como banner com cor do tipo como accent
- Secoes com separadores visuais e icones
- Cards de equipe com animacao ao expandir membros
- Botao "Modo Foco" mais destacado (gradient, icone animado)
- Skeleton durante loading

**`src/pages/EventCreate.tsx`** / **`EventForm.tsx`**:
- Formulario em steps visuais ou com secoes colapsaveis
- Feedback visual nos campos obrigatorios
- Botao submit com loading spinner e texto dinamico

**`src/pages/MySchedulePage.tsx`**:
- Cards com animacao staggered de entrada
- Indicador visual mais forte para eventos urgentes (borda + pulse)
- Usar `EmptyState` para lista vazia
- Badge de status com cores mais distintas

### 7. Animacoes Ricas

Adicionar ao `tailwind.config.ts`:
- `fade-in`: translateY(10px) + opacity 0 -> 1, 300ms
- `slide-up`: translateY(20px) -> 0, 400ms
- `scale-in`: scale(0.95) + opacity -> 1, 200ms
- `slide-in-right`: translateX(100%) -> 0, 300ms
- `stagger-fade`: classe utilitaria com `animation-delay` via CSS custom property

Uso:
- `<main>` do layout: `animate-fade-in`
- Cards do dashboard: `animate-fade-in` com delay incrementado via `style`
- Modais: ja usam Radix animations
- Sidebar collapse: transition no width (ja suportado)
- Listas: cada item com delay `i * 50ms`

## Detalhes Tecnicos

| Arquivo | Acao |
|---------|------|
| `src/index.css` | Refinar paleta light/dark, adicionar success/warning vars |
| `tailwind.config.ts` | Keyframes ricos, cores success/warning |
| `src/components/ThemeToggle.tsx` | Novo: toggle dark mode |
| `src/components/layout/AppLayout.tsx` | Header refinado, ThemeToggle, fade-in main |
| `src/components/layout/AppSidebar.tsx` | Hover states, badge notificacoes, footer polido |
| `src/components/ui/page-header.tsx` | Novo: header padrao de pagina |
| `src/components/ui/skeleton-card.tsx` | Novo: skeleton reutilizavel |
| `src/components/ui/empty-state.tsx` | Novo: estado vazio elegante |
| `src/components/ui/stat-card.tsx` | Novo: card de metrica |
| `src/pages/DashboardPage.tsx` | Refinar com novos componentes |
| `src/pages/ProfilePage.tsx` | Avatar, disponibilidade, sticky save |
| `src/pages/Events.tsx` | Skeleton, page-header |
| `src/pages/EventDetailPage.tsx` | Banner, secoes visuais |
| `src/pages/EventCreate.tsx` | Page-header |
| `src/components/events/EventCalendar.tsx` | Hover, tooltip, transicoes |
| `src/components/events/EventForm.tsx` | Loading states |
| `src/pages/MySchedulePage.tsx` | Stagger, empty-state, urgencia visual |

## Seguranca

- Nenhuma alteracao em logica de negocio, queries ou RLS
- Apenas mudancas visuais e de UX

## Ordem de implementacao

1. Theme system (CSS vars + ThemeToggle + tailwind keyframes)
2. Componentes base (PageHeader, SkeletonCard, EmptyState, StatCard)
3. AppLayout + AppSidebar refinados
4. DashboardPage com novos componentes
5. ProfilePage refinado
6. Eventos (Calendar, Detail, Create, MySchedule)

