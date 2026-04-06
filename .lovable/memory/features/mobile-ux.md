---
name: Mobile UX Premium
description: Mobile-first app experience with bottom nav, more sheet, safe areas, and phased improvements
type: feature
---

## Phase 1 (Done)
- Bottom Navigation: Home, Eventos, Agenda, Perfil, Mais
- "Mais" opens as Drawer/BottomSheet with admin sections separated
- Minimalist mobile header (theme toggle + notifications only)
- Safe areas for iPhone notch (viewport-fit=cover, env(safe-area-inset))
- Sidebar hidden on mobile, kept for desktop
- Smooth scrolling, tap highlight disabled

## Phase 2 (Pending)
- Cards estilo app (rounded-xl, sombras leves)
- Botões mobile (w-full, min-h-[48px])
- Listas otimizadas (sem tabelas no mobile)
- Inputs grandes com labels claras

## Phase 3 (Pending)
- Animações e transições entre telas
- Modais como bottom sheets
- Performance (lazy loading, memoization)

## Components
- `BottomNav` — src/components/layout/BottomNav.tsx
- `MoreSheet` — src/components/layout/MoreSheet.tsx
- `AppLayout` — conditional mobile/desktop layout
