

# White Label + Domínio Customizado

## Resumo

Implementar personalização visual por empresa (cores, logo, tema light/dark, favicon), domínio customizado com verificação DNS, e vincular tudo aos flags `allows_whitelabel` e `allows_custom_domain` dos planos.

## Arquitetura

```text
┌─────────────────────────────────────────────┐
│  Navegador acessa domínio                   │
│  ↓                                          │
│  CompanyThemeProvider (context)              │
│  ├─ detecta hostname                        │
│  ├─ busca company por custom_domain         │
│  ├─ fallback: usa company do user logado    │
│  ├─ aplica CSS vars (cores, tema)           │
│  └─ expõe logo, nome, favicon, whitelabel   │
│                                             │
│  AppLayout / BioPublicPage consomem context │
│  ├─ Sidebar: logo/nome da company ou "P"    │
│  ├─ Header: sem mudanças                    │
│  └─ Biolink: usa cores/logo da company      │
│                                             │
│  Admin Settings > aba "White Label"         │
│  ├─ só aparece se plano allows_whitelabel   │
│  ├─ tema (light/dark), favicon_url          │
│  └─ preview em tempo real                   │
│                                             │
│  Admin Settings > aba "Domínio"             │
│  ├─ só aparece se allows_custom_domain      │
│  ├─ input domínio, status verificação       │
│  └─ botão verificar DNS (edge function)     │
└─────────────────────────────────────────────┘
```

## Etapas

### 1. Migração SQL

Expandir tabela `companies`:
- `theme` text default 'light' (light | dark)
- `favicon_url` text nullable
- `domain_verified` boolean default false

Nota: `custom_domain`, `logo_url`, `primary_color`, `secondary_color` já existem.

Adicionar constraint unique em `custom_domain` (parcial, onde não nulo).

### 2. Edge Function `verify-domain`

- Recebe `company_id` + `custom_domain`
- Valida que o domínio não pertence a outra company
- Faz lookup DNS (CNAME ou TXT) para verificar apontamento
- Marca `domain_verified = true` se OK
- Usa `service_role` para update

### 3. CompanyThemeProvider (Context)

Novo contexto React que:
- Detecta `window.location.hostname`
- Se hostname diferente do padrão, busca company por `custom_domain` (query pública, anon)
- Se user logado, busca company pelo `company_id` do profile
- Cacheia com React Query (staleTime longo)
- Aplica CSS custom properties no `<html>`:
  - `--company-primary`, `--company-secondary`
  - classe `dark` se tema = dark
- Expõe: `companyName`, `logoUrl`, `faviconUrl`, `isWhitelabel`, `allowsCustomDomain`, `theme`
- Atualiza `<link rel="icon">` dinamicamente se `faviconUrl` existe

### 4. Aplicar tema no layout

- **AppSidebar**: se `isWhitelabel` e tem logo, mostra logo da company no lugar do "P" / "Pascomfy". Caso contrário, mantém "Pascomfy" (marca visível).
- **BioPublicPage**: se whitelabel ativo, esconde footer "PASCOMFY" (ou troca pelo nome da company).
- **AppLayout**: sem mudanças significativas.

### 5. Tela White Label (aba em AdminSettings)

Nova aba "Identidade" que só aparece se o plano `allows_whitelabel`:
- Seletor de tema (light/dark) com toggle
- Input favicon URL com preview
- Preview card com as cores/logo/tema aplicados
- Salva em `companies`

### 6. Tela Domínio Customizado (aba em AdminSettings)

Nova aba "Domínio" que só aparece se o plano `allows_custom_domain`:
- Input do domínio
- Status atual (não configurado / pendente / verificado)
- Instrução: "Aponte um CNAME para app.pascomfy.com"
- Botão "Verificar DNS" que chama edge function
- Badge verde se verificado

### 7. Vincular aos planos (funcional)

A tabela `plans` já tem `allows_whitelabel` e `allows_custom_domain`. O SuperAdminPlans já edita esses campos. No frontend:
- `CompanyThemeProvider` verifica o plano via subscription para decidir se aplica whitelabel
- Abas de White Label e Domínio só aparecem se plano permite
- Se plano não permite, cores/logo continuam funcionando (já existem), mas tema/favicon/remoção de marca não

### 8. RLS

- Nenhuma nova tabela, apenas colunas em `companies` (RLS já cobre)
- Edge function `verify-domain` usa `service_role`
- Nova RLS policy para anon SELECT em `companies` filtrando por `custom_domain` (para resolver domínio sem login)

## Detalhes Técnicos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Adicionar `theme`, `favicon_url`, `domain_verified`, unique constraint |
| `supabase/functions/verify-domain/index.ts` | Nova edge function |
| `src/contexts/CompanyThemeContext.tsx` | Novo contexto |
| `src/App.tsx` | Wrapper com CompanyThemeProvider |
| `src/components/admin/CompanySettings.tsx` | Mover para tab "Empresa" (já é) |
| `src/components/admin/WhiteLabelSettings.tsx` | Novo: tema + favicon |
| `src/components/admin/CustomDomainSettings.tsx` | Novo: domínio + verificação |
| `src/pages/admin/AdminSettings.tsx` | Adicionar abas condicionais |
| `src/components/layout/AppSidebar.tsx` | Consumir theme context para logo |
| `src/pages/BioPublicPage.tsx` | Consumir theme context para footer |

## Segurança

- Domínio unique constraint impede conflitos
- Edge function valida DNS antes de marcar verificado
- Anti-hijack: verifica que domínio não pertence a outra company
- RLS anon em companies limitado a SELECT de `id, name, logo_url, primary_color, secondary_color, theme, favicon_url, custom_domain` onde `custom_domain = hostname`

