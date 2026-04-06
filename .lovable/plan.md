

# Pascomfy — Sistema de Afiliados Completo

## Resumo

Reestruturar as tabelas de afiliados existentes, criar tela de signup público com código de indicação, painel do admin para ver/compartilhar seu código, recompensas configuráveis, e conversão automática no webhook de pagamento.

## Arquitetura

```text
┌──────────────────────────────────────────────┐
│  Signup Público (/signup?ref=CODIGO)         │
│  Cria company + profile + vincula referral   │
└────────────┬─────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────┐
│  DB: affiliate_program, affiliate_referrals, │
│      affiliate_rewards                       │
└────────────┬──────────────┬──────────────────┘
             │              │
┌────────────▼──────┐  ┌────▼─────────────────┐
│  Webhook (Asaas/  │  │  Admin: /admin/      │
│  MercadoPago)     │  │  referrals           │
│  Converte + aplica│  │  Ver código, indicar │
│  recompensa       │  └──────────────────────┘
└───────────────────┘
```

## Etapa 1 — Migração SQL

**Reestruturar `affiliate_program`** (já existe, ajustar):
- Renomear `commission_pct` para `reward_type` (enum: `dias_gratis`, `desconto`, `upgrade`)
- Adicionar `reward_value` (numeric, default 30 — ex: 30 dias ou 10% desconto)
- Manter: `id`, `company_id`, `code` (unique), `active`, `created_at`

**Reestruturar `affiliate_referrals`** (já existe, ajustar):
- Renomear `affiliate_id` → manter como FK para `affiliate_program.id`
- Manter: `referred_company_id`, `status` (pendente/convertido/cancelado), `created_at`

**Nova tabela `affiliate_rewards`:**
- `id`, `affiliate_company_id`, `referral_id` (FK affiliate_referrals), `reward_type` (enum), `reward_value` (numeric), `applied` (boolean, default false), `applied_at` (timestamptz nullable), `created_at`

**RLS:**
- `affiliate_rewards`: Company admin SELECT own (via company_id match), super_admin ALL, service_role ALL
- Ajustar políticas existentes de `affiliate_program` e `affiliate_referrals`

**Validações:**
- Trigger ou constraint: impedir auto-indicação (affiliate company_id != referred_company_id)
- Unique constraint em `affiliate_referrals(referred_company_id)` — cada company só pode ser indicada uma vez

**Índices:**
- `affiliate_referrals(status)`
- `affiliate_rewards(affiliate_company_id, applied)`

## Etapa 2 — Tela de Signup Público

**Nova página:** `src/pages/Signup.tsx` — rota `/signup`

- Campos: nome da company, nome do admin, email, senha
- Campo opcional "Código de indicação" (pré-preenchido se `?ref=CODIGO` na URL)
- Ao submeter:
  1. `supabase.auth.signUp()` com metadata `{ name, company_name, referral_code }`
  2. Trigger `handle_new_user` expandido para:
     - Criar company automaticamente (se não tem invite)
     - Criar subscription trial
     - Se `referral_code` presente: buscar `affiliate_program` pelo code, inserir `affiliate_referrals` com status `pendente`

**Migração adicional:** Atualizar função `handle_new_user()` para tratar signup com criação de company e vinculação de referral.

## Etapa 3 — Painel Admin de Indicações

**Nova página:** `src/pages/admin/AdminReferrals.tsx` — rota `/admin/referrals`

- Mostra o código de indicação da company (ou cria automaticamente se não existe)
- Link compartilhável: `{origin}/signup?ref=CODIGO`
- Botão copiar link
- Tabela com indicações: company indicada, status, data, recompensa
- Tipo e valor da recompensa configurável (se super admin permitir)

**Hook:** `src/hooks/useAffiliateProgram.ts`
- Query do programa da company
- Auto-criação do programa se não existe (gerar código aleatório)
- Query de referrals + rewards

**Sidebar:** Adicionar "Indicações" na seção admin com ícone `Users`

## Etapa 4 — Conversão Automática no Webhook

**Expandir `asaas-webhook/index.ts` e `mercadopago-webhook/index.ts`:**

Quando `PAYMENT_CONFIRMED`:
1. Checar se a `company_id` do pagamento tem uma entrada em `affiliate_referrals` com status `pendente`
2. Se sim: atualizar para `convertido`
3. Buscar programa do afiliado para saber `reward_type` e `reward_value`
4. Inserir em `affiliate_rewards` com `applied = false`
5. Aplicar recompensa:
   - `dias_gratis`: adicionar dias ao `ends_at` da subscription do afiliado
   - `desconto`: salvar para uso na próxima cobrança (metadata na subscription)
   - `upgrade`: sinalizar para super admin (notificação)
6. Marcar `applied = true`

## Etapa 5 — Super Admin Expandido

**Expandir `SuperAdminAffiliates.tsx`:**
- Mostrar reward_type e reward_value em vez de commission_pct
- Adicionar coluna de recompensas aplicadas
- Botão para ativar/desativar programa
- Editar tipo e valor de recompensa

## Etapa 6 — Prevenção de Fraude

- No signup: validar que `referral_code` não pertence à mesma company sendo criada (impossível por natureza, mas validar no trigger)
- Unique em `referred_company_id` na tabela referrals
- Rate limit no signup (Supabase auth já tem)

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Reestruturar affiliate_program, referrals, criar rewards |
| `handle_new_user()` | Expandir para criar company + vincular referral |
| `src/pages/Signup.tsx` | Criar (signup público) |
| `src/pages/admin/AdminReferrals.tsx` | Criar (painel indicações) |
| `src/hooks/useAffiliateProgram.ts` | Criar |
| `src/App.tsx` | Adicionar rotas /signup e /admin/referrals |
| `src/components/layout/AppSidebar.tsx` | Item "Indicações" |
| `supabase/functions/asaas-webhook/index.ts` | Lógica de conversão |
| `supabase/functions/mercadopago-webhook/index.ts` | Lógica de conversão |
| `src/pages/superadmin/SuperAdminAffiliates.tsx` | Expandir com rewards |

## Segurança

- RLS em todas as tabelas novas
- Trigger valida anti-fraude (auto-indicação)
- Webhooks usam service_role para inserir rewards
- Admin só vê dados da própria company

