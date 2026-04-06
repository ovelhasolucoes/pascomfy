---
name: Mobile UX Premium
description: Mobile-first app experience with bottom nav, more sheet, safe areas, responsive dialog, lazy loading
type: feature
---

## Phase 1 (Done)
- Bottom Navigation: Home, Eventos, Agenda, Perfil, Mais
- "Mais" opens as Drawer/BottomSheet with admin sections separated
- Minimalist mobile header (theme toggle + notifications only)
- Safe areas for iPhone notch (viewport-fit=cover, env(safe-area-inset))
- Sidebar hidden on mobile, kept for desktop

## Phase 2 (Done)
- Cards: rounded-xl, p-4 mobile / p-6 desktop
- Buttons: h-12 mobile / h-10 desktop, rounded-xl, active:scale-[0.97]
- Inputs/Textarea: h-12 mobile, rounded-xl, text-base (no iOS zoom)
- Select: h-12 mobile, rounded-xl
- Users page: card list on mobile, table on desktop

## Phase 3 (Done)
- ResponsiveDialog component: auto Drawer on mobile, Dialog on desktop
- Page transitions: page-transition CSS class (translateY fade-in)
- Micro-interactions: tap-highlight, touch-list classes
- Lazy loading: all routes except Login & Dashboard are lazy-loaded with Suspense
- Spinner fallback component (PageLoader)

## Components
- `BottomNav` — src/components/layout/BottomNav.tsx
- `MoreSheet` — src/components/layout/MoreSheet.tsx
- `ResponsiveDialog` — src/components/ui/responsive-dialog.tsx (use instead of Dialog for mobile bottom sheet)
- `AppLayout` — conditional mobile/desktop layout
