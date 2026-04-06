

# Pascomfy — Sistema de Billing & Assinaturas com Asaas

## Resumo

Sistema completo de billing SaaS: tabela `payments`, edge functions para integração real com Asaas (criar cliente, cobrança, webhook), trial híbrido com alertas + automação, bloqueio configurável por company, e UI no super admin.

## Arquitetura

```text
┌─────────────────────────────────────────────────┐
│  Super Admin UI                                 │
│  /superadmin/subscriptions (expandida)          │
│  /superadmin/companies (bloqueio config)        │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  Supabase DB                                    │
│  payments (novo) + subscriptions (expandir)     │
│  companies.block_mode (novo campo)              │
└────────────┬──────────────┬─────────────────────┘
             │              │
┌────────────▼──────┐  ┌────▼────────────────────┐
│  Edge: asaas-     │  │  Edge: asaas-webhook    │
│  billing          │  │  POST (público)         │
│  (criar cliente,  │  │  Valida token, atualiza │
│  gerar cobrança)  │  │  payment + subscription │
└───────────────────┘  └─────────────────────────┘
                       ┌─────────────────────────┐
                       │  Edge: check-trials     │
                       │  CRON (diário)           │
                       │  Alerta + muda status   │
                       └─────────────────────────┘
```

## Etapa 1 — Migração SQL

**Nova tabela `payments`:**
- `id`, `company_id`, `subscription_id`, `amount` (numeric), `status` (enum: `pago`, `pendente`, `falhou`, `estornado`), `gateway` (text), `external_id` (text), `paid_at` (timestamptz nullable), `created_at`

**Expandir `subscriptions`:**
- Adicionar `trial_until` (timestamptz nullable)
- Adicionar `asaas_customer_id` (text nullable)
- Adicionar `asaas_subscription_id` (text nullable)

**Expandir `companies`:**
- Adicionar `block_mode` (text, default `'soft'`, valores: `'soft'`, `'hard'`, `'none'`)

**RLS para `payments`:**
- Super admin: ALL
- Company admin: SELECT onde `company_id = get_user_company_id(auth.uid())`
- Service role: INSERT/UPDATE (webhooks)

**Enum:** `payment_status` (`pago`, `pendente`, `falhou`, `estornado`)

## Etapa 2 — Edge Function `asaas-billing`

**Arquivo:** `supabase/functions/asaas-billing/index.ts`

Endpoints (via body action):
1. **`create_customer`** — Cria cliente no Asaas com dados da company (name, email do admin). Salva `asaas_customer_id` na subscription.
2. **`create_charge`** — Gera cobrança (boleto/PIX) no Asaas para a subscription. Insere registro em `payments` com status `pendente`.
3. **`create_subscription`** — Cria assinatura recorrente no Asaas (boleto ou PIX). Salva `asaas_subscription_id`.

Requer secret: `ASAAS_API_KEY` (sandbox ou produção).
Autenticação: valida JWT, verifica `super_admin` role.

## Etapa 3 — Edge Function `asaas-webhook`

**Arquivo:** `supabase/functions/asaas-webhook/index.ts`

- Endpoint público (sem JWT)
- Valida token de webhook do Asaas via header ou query param
- Eventos tratados:
  - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` → atualiza `payments.status = 'pago'`, `subscription.status = 'ativo'`, `company.status = 'ativa'`
  - `PAYMENT_OVERDUE` → `payments.status = 'falhou'`, `subscription.status = 'atrasado'`
  - `PAYMENT_REFUNDED` → `payments.status = 'estornado'`
- Requer secret: `ASAAS_WEBHOOK_TOKEN`

## Etapa 4 — Edge Function `check-trials`

**Arquivo:** `supabase/functions/check-trials/index.ts`

- Executada via CRON (pg_cron diário)
- Busca subscriptions com `status = 'trial'` e `trial_until < now()`
- Ação: muda `subscription.status = 'atrasado'` e insere notificação para o admin da company
- Não bloqueia diretamente (super admin decide) — comportamento híbrido

## Etapa 5 — Bloqueio Configurável

**No `ProtectedRoute.tsx`:**
- Verificar `company.status` e `company.block_mode`:
  - `hard` + status `suspensa`/`cancelada` → redireciona para tela "Conta Suspensa" com link de pagamento
  - `soft` + status `suspensa` → banner de aviso no topo, bloqueia criação de eventos/posts
  - `none` → sem bloqueio (super admin decide não bloquear)

**Nova página:** `src/pages/AccountBlocked.tsx` — tela para hard block com informações de contato/pagamento

## Etapa 6 — UI Super Admin

**Expandir `SuperAdminSubscriptions.tsx`:**
- Adicionar colunas: Trial até, Gateway, Asaas ID
- Botão "Gerar Cobrança" que chama `asaas-billing` (create_charge)
- Botão "Criar no Asaas" para vincular company ao gateway

**Expandir `SuperAdminCompanies.tsx` (CompanyDetailSheet):**
- Campo para selecionar `block_mode` (soft/hard/none)
- Seção mostrando histórico de pagamentos da company

**Nova página:** `src/pages/superadmin/SuperAdminPayments.tsx`
- Tabela com todos payments (company, valor, status, gateway, data)
- Filtros por status e company
- Rota: `/superadmin/payments`

**Sidebar:** Adicionar item "Pagamentos" na seção super admin com ícone `Receipt`

## Etapa 7 — Hook e Queries

**`src/hooks/usePayments.ts`:**
- Query de payments por company ou global (super admin)
- Mutation para chamar edge function `asaas-billing`

**Expandir `useSubscriptions.ts`:**
- Incluir campos novos (trial_until, asaas_customer_id)

## Segurança

- Asaas API key e webhook token como secrets do Supabase (nunca no frontend)
- Webhook valida token antes de processar
- Dados financeiros acessíveis apenas por super admin e admin da company (via RLS)
- Edge functions validam JWT e role antes de ações financeiras

## Secrets Necessários

- `ASAAS_API_KEY` — chave da API Asaas (sandbox inicialmente)
- `ASAAS_WEBHOOK_TOKEN` — token para validar webhooks

