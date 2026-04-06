

# Pascomfy — Módulo Biolink

## Resumo

Sistema de biolink (link-in-bio) por company, com página pública SSR via Edge Function, painel admin no sidebar, e analytics de cliques. Cada paróquia terá sua página pública acessível sem login.

## Arquitetura

```text
┌─────────────────────────────────────────────────┐
│  Admin (SPA React)                              │
│  /admin/biolink → editar links, cores, logo     │
│  AdminRoute protegido                           │
└────────────┬────────────────────────────────────┘
             │ supabase client
┌────────────▼────────────────────────────────────┐
│  Supabase DB                                    │
│  biolinks + biolink_items + biolink_clicks      │
│  RLS: admin write, anon read (ativo=true)       │
└────────────┬────────────────────────────────────┘
             │ service_role
┌────────────▼────────────────────────────────────┐
│  Edge Function: biolink-page                    │
│  GET /?slug=paroquia-sao-jose                   │
│  Retorna HTML completo (SSR)                    │
│  Registra clique via query param ?click=item_id │
└─────────────────────────────────────────────────┘
```

A página pública será acessada via URL do Edge Function. Internamente, o slug resolve para a company correta.

## Etapa 1 — Migração SQL

Três tabelas:

**biolinks**
- `id`, `company_id` (FK companies), `slug` (unique), `titulo`, `descricao`, `logo_url`, `cor_primaria` (#6366f1), `cor_secundaria` (#8b5cf6), `ativo` (default true), `created_at`

**biolink_items**
- `id`, `biolink_id` (FK biolinks CASCADE), `titulo`, `url`, `tipo` (enum: link, whatsapp, youtube, instagram, facebook, doacao), `icone`, `ordem` (int), `ativo` (default true), `created_at`

**biolink_clicks**
- `id`, `biolink_item_id` (FK biolink_items CASCADE), `clicked_at` (default now()), `user_agent`, `referer`
- Sem company_id necessário (join via biolink_items → biolinks)

**RLS Policies:**
- `biolinks`: admin da company faz ALL; anon SELECT onde `ativo = true`; members SELECT da company
- `biolink_items`: admin da company faz ALL; anon SELECT onde `ativo = true` e biolink ativo; members SELECT da company
- `biolink_clicks`: service_role INSERT; admin da company SELECT (via join)

**Índices:**
- `UNIQUE` em `biolinks.slug`
- Index em `biolink_items.biolink_id` + `ordem`
- Index em `biolink_clicks.biolink_item_id` + `clicked_at`

## Etapa 2 — Edge Function `biolink-page`

**Arquivo:** `supabase/functions/biolink-page/index.ts`

Lógica:
1. Recebe `slug` via query param (`?slug=xxx`)
2. Se receber `?click=item_id`, registra clique em `biolink_clicks` e redireciona para a URL do item (302)
3. Caso contrário, busca biolink + items (ativo=true, ordenados por `ordem`)
4. Retorna HTML completo com:
   - Meta tags (title, description, og:image)
   - CSS inline com cores personalizadas
   - Logo, título, descrição
   - Lista de links estilizados por tipo (ícones diferentes para WhatsApp, YouTube, etc.)
   - Links apontam para o próprio Edge Function com `?slug=xxx&click=item_id` (para tracking)
5. Design responsivo, mobile-first, leve (sem JS framework)

## Etapa 3 — Admin UI

**Nova rota:** `/admin/biolink` (protegida com AdminRoute)

**Sidebar:** Novo item "Biolink" com ícone `Link2` na seção admin

**Página:** `src/pages/admin/AdminBiolink.tsx`
- Se não existe biolink para a company, mostra formulário de criação (slug, título, etc.)
- Se existe, mostra:
  - Preview miniatura do biolink
  - Formulário de personalização (cores, logo, título, descrição, slug)
  - Toggle ativo/desativo
  - Lista de items com drag-to-reorder (ou setas ↑↓)
  - Botão adicionar item (dialog com: título, url, tipo, ícone)
  - Toggle ativo por item
  - Link para abrir a página pública

**Componentes:**
- `src/components/biolink/BiolinkEditor.tsx` — formulário principal
- `src/components/biolink/BiolinkItemList.tsx` — lista de items ordenável
- `src/components/biolink/BiolinkItemDialog.tsx` — dialog add/edit item
- `src/components/biolink/BiolinkPreview.tsx` — preview inline

**Hook:** `src/hooks/useBiolink.ts` — CRUD de biolinks e items via React Query

**Analytics simples:** Seção no editor mostrando total de cliques por item (query count agrupada)

## Etapa 4 — Sidebar e Rotas

- Adicionar item "Biolink" no sidebar (seção admin, ícone Link2)
- Adicionar rota `/admin/biolink` com AdminRoute no App.tsx

## Detalhes Técnicos

- Edge Function usa `service_role` para ler dados (anon read via RLS) e inserir cliques
- HTML gerado é ~5KB, sem dependências externas, carregamento ultra-rápido
- Tipo enum para `biolink_item_type` garante consistência
- Slug validado no frontend (lowercase, hifens, sem espaços)
- CORS não necessário (Edge Function retorna HTML, não JSON)
- URL pública: `https://cchovdurprjtefisautg.supabase.co/functions/v1/biolink-page?slug=xxx`

## Evoluções Futuras

- Temas pré-definidos (dark, colorful, minimal)
- QR Code gerado automaticamente para o biolink
- Custom domain por company (pascomfy.app/slug → dominio-proprio.com)
- Integração com analytics externo (GA, Pixel)
- Formulário de contato embutido no biolink

