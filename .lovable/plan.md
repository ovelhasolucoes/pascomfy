

# Pascomfy — Módulo Social Post (Meta Integration)

## Resumo

Cada company configura seu proprio Meta App (App ID + App Secret), conecta suas Pages/Instagram via OAuth, e publica conteúdo diretamente pelo Pascomfy. Agendamento via `scheduled_publish_time` da API da Meta. UI como nova seção "Social" no sidebar.

## Arquitetura

```text
┌─────────────────────────────────────────────────┐
│  Frontend (React)                               │
│  /social/posts — criar/listar posts             │
│  /social/calendar — calendário visual           │
│  /social/accounts — conectar contas Meta        │
├─────────────────────────────────────────────────┤
│  Edge Functions                                 │
│  meta-oauth      — OAuth callback, troca code   │
│  social-publish  — publica/agenda na Meta API   │
├─────────────────────────────────────────────────┤
│  Supabase DB                                    │
│  social_accounts — tokens + page_id + ig_id     │
│  social_posts    — posts + status + scheduling  │
│  social_media    — mídia temporária (ref only)   │
└─────────────────────────────────────────────────┘
```

## Fase 1 — Database (Migration)

### Tabela `social_accounts`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| company_id | uuid NOT NULL | FK companies |
| provider | text DEFAULT 'meta' | Extensível para futuro |
| app_id | text NOT NULL | Meta App ID da company |
| app_secret_encrypted | text NOT NULL | Armazenado encriptado |
| access_token | text | Long-lived token |
| token_expires_at | timestamptz | Expiração do token |
| page_id | text | Facebook Page ID |
| page_name | text | Nome da Page |
| instagram_id | text | IG Business Account ID |
| instagram_username | text | |
| status | text DEFAULT 'ativo' | ativo/desconectado/erro |
| created_at | timestamptz DEFAULT now() | |

RLS: admin da company gerencia, membros leem (sem tokens).

### Tabela `social_posts`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | uuid PK | |
| company_id | uuid NOT NULL | |
| social_account_id | uuid NOT NULL | FK social_accounts |
| caption | text | Legenda do post |
| media_type | text | imagem/video/carousel |
| media_urls | jsonb DEFAULT '[]' | URLs temporárias para envio |
| platform | text NOT NULL | facebook/instagram/ambos |
| status | text DEFAULT 'rascunho' | rascunho/agendado/publicando/publicado/erro |
| error_message | text | Detalhes do erro |
| scheduled_at | timestamptz | Quando publicar |
| published_at | timestamptz | Quando foi publicado |
| meta_post_id | text | ID do post na Meta |
| meta_ig_post_id | text | ID do post no Instagram |
| created_by | uuid NOT NULL | |
| created_at | timestamptz DEFAULT now() | |

RLS: admin/permission cria, membros da company leem.

### Índices
- `social_accounts(company_id)`
- `social_posts(company_id, status)`
- `social_posts(company_id, scheduled_at)` WHERE status = 'agendado'

### View segura para membros
View `social_accounts_safe` que exclui `access_token`, `app_secret_encrypted` — membros consultam apenas essa view.

## Fase 2 — Edge Functions

### `meta-oauth` (nova)
1. Recebe `company_id` + `code` do callback OAuth
2. Busca `app_id` e `app_secret` de `social_accounts` (via service_role)
3. Troca code por short-lived token, depois converte em long-lived token (60 dias)
4. Busca Pages do usuário via `/me/accounts`
5. Busca Instagram Business Account vinculado à Page
6. Salva tudo em `social_accounts`

### `social-publish` (nova)
1. Recebe `post_id`
2. Busca post + social_account (com tokens, via service_role)
3. Verifica token válido (se expirado, tenta refresh)
4. Para Facebook:
   - Upload foto via `/{page_id}/photos` ou post via `/{page_id}/feed`
   - Se agendado: usa `scheduled_publish_time`
5. Para Instagram:
   - Cria container via `/{ig_id}/media` com `image_url` + `caption`
   - Publica via `/{ig_id}/media_publish`
   - Se agendado: usa `scheduled_publish_time` (IG não suporta nativo, então armazena como agendado e pg_cron dispara)
6. Atualiza `social_posts` com `meta_post_id` e status
7. Registra em `notification_logs` se houver erro

### Nota sobre Instagram agendado
Instagram Graph API não suporta `scheduled_publish_time`. Para posts agendados no IG, o sistema armazena com status `agendado` e um pg_cron job (reutilizando padrão existente) verifica a cada minuto e publica quando `scheduled_at <= now()`.

## Fase 3 — Frontend

### Nova seção "Social" no sidebar
Visível para admin. 3 itens:
- Posts (`/social/posts`) — lista + criação
- Calendário (`/social/calendar`) — visualização mensal
- Contas (`/social/accounts`) — conexão Meta

### Página Contas (`/social/accounts`)
- Admin insere App ID + App Secret da company
- Botão "Conectar com Facebook" inicia OAuth
- Após callback, mostra Page + IG vinculados
- Status da conexão (token válido/expirado)
- Botão reconectar se token expirado

### Página Posts (`/social/posts`)
- Lista de posts com filtros por status
- Botão "Novo Post" abre formulário:
  - Upload de mídia (temporário, não persiste)
  - Legenda
  - Plataforma (Facebook, Instagram, Ambos)
  - Publicar agora ou Agendar (date picker)
- Preview do post
- Status badges coloridos

### Página Calendário (`/social/calendar`)
- Reutiliza padrão do `EventCalendar` existente
- Mostra posts agendados/publicados por data
- Click em dia mostra posts daquele dia

## Fase 4 — Segurança

- `app_secret_encrypted`: encriptado via `pgcrypto` com chave em secret do Supabase
- `access_token`: acessível apenas via service_role (Edge Functions)
- RLS isola tudo por company_id
- View `social_accounts_safe` para frontend (sem tokens)
- OAuth state parameter para prevenir CSRF
- Validação de input com Zod nas Edge Functions

## Fase 5 — Tratamento de Erros

- Token expirado: Edge Function tenta refresh automático, se falhar marca conta como `erro` e notifica admin
- API da Meta retorna erro: salva `error_message` no post, status `erro`, notifica admin
- Rate limiting da Meta: retry com backoff exponencial
- Conta desconectada: marca status e alerta via notificação in-app

## Fluxo de Publicação

```text
1. Admin cria post (legenda + mídia + plataforma)
2. Upload temporário da mídia para URL pública (Supabase Storage temp bucket, TTL 1h)
3. Se "publicar agora":
   → chama social-publish imediatamente
   → Edge Function envia para Meta API
   → Atualiza status para "publicado" ou "erro"
4. Se "agendar":
   → Para Facebook: usa scheduled_publish_time nativo
   → Para Instagram: salva como "agendado", pg_cron publica no horário
5. Após publicação bem-sucedida:
   → Remove mídia temporária
   → Salva meta_post_id
```

## Arquivos a criar/editar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabelas, view, índices, RLS |
| `supabase/functions/meta-oauth/index.ts` | Criar |
| `supabase/functions/social-publish/index.ts` | Criar |
| `src/pages/social/SocialPosts.tsx` | Criar |
| `src/pages/social/SocialCalendar.tsx` | Criar |
| `src/pages/social/SocialAccounts.tsx` | Criar |
| `src/hooks/useSocialAccounts.ts` | Criar |
| `src/hooks/useSocialPosts.ts` | Criar |
| `src/components/social/PostForm.tsx` | Criar |
| `src/components/social/PostCard.tsx` | Criar |
| `src/components/social/PostCalendarView.tsx` | Criar |
| `src/components/social/MetaConnectButton.tsx` | Criar |
| `src/components/layout/AppSidebar.tsx` | Adicionar seção Social |
| `src/App.tsx` | Adicionar rotas /social/* |

## Detalhes Técnicos

- OAuth redirect URI: `https://cchovdurprjtefisautg.supabase.co/functions/v1/meta-oauth`
- Meta Graph API v21.0
- Permissões OAuth necessárias: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
- Long-lived tokens duram ~60 dias, depois precisam de re-auth
- Mídia temporária: bucket `social-temp` com lifecycle policy ou cleanup via Edge Function
- pg_cron para IG scheduled: `*/1 * * * *` verifica posts com `status = 'agendado'` e `scheduled_at <= now()`

