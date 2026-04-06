

# Pascomfy — Painel Super Admin (Backend + Frontend)

## Resumo

Migração SQL para expandir a tabela `plans`, criar `subscriptions`, `affiliate_program`, `affiliate_referrals`, `support_tickets`, `support_messages` e `global_logs`. Expandir `companies` com campos de controle. Frontend com painel completo de super admin: dashboard de métricas, gestão de companies/planos/assinaturas, afiliados, tickets e logs.

## Migração SQL

### Enums novos
- `subscription_status`: ativo, cancelado, trial, atrasado
- `company_status`: ativa, suspensa, cancelada
- `ticket_status`: aberto, respondido, fechado
- `referral_status`: pendente, convertido

### Alterações em `plans`
Adicionar colunas: `price_monthly` numeric(10,2), `max_uploads` int default 100, `allows_whitelabel` boolean default false, `allows_custom_domain` boolean default false, `description` text nullable.

### Alterações em `companies`
Adicionar colunas: `status` company_status default 'ativa', `storage_used_mb` int default 0, `active_users_count` int default 0, `trial_until` timestamptz nullable, `custom_domain` text nullable, `settings` jsonb default '{}', `subscription_id` uuid nullable (FK para subscriptions, adicionada após criar a tabela).

### Novas tabelas

**subscriptions**
- `id` uuid PK, `company_id` FK→companies, `plan_id` FK→plans, `status` subscription_status default 'trial', `started_at` timestamptz default now(), `ends_at` timestamptz nullable, `gateway` text nullable, `external_id` text nullable, `created_at`
- Indexes: (company_id), (status), (plan_id)
- RLS: SELECT para membros da company (own); ALL para super_admin

**affiliate_program**
- `id` uuid PK, `company_id` FK→companies, `code` text unique, `active` boolean default true, `commission_pct` numeric(5,2) default 10, `created_at`
- RLS: SELECT own company; ALL super_admin

**affiliate_referrals**
- `id` uuid PK, `affiliate_id` FK→affiliate_program, `referred_company_id` FK→companies, `status` referral_status default 'pendente', `reward_applied` boolean default false, `created_at`
- RLS: SELECT via join com affiliate_program.company_id; ALL super_admin

**support_tickets**
- `id` uuid PK, `company_id` FK→companies, `user_id` FK→profiles(id), `title` text, `description` text, `status` ticket_status default 'aberto', `created_at`
- Indexes: (company_id), (status), (user_id)
- RLS: SELECT/INSERT/UPDATE own company; ALL super_admin

**support_messages**
- `id` uuid PK, `ticket_id` FK→support_tickets ON DELETE CASCADE, `user_id` FK→profiles(id), `message` text, `created_at`
- RLS: SELECT via join com ticket.company_id; INSERT own ticket; ALL super_admin

**global_logs**
- `id` uuid PK, `user_id` uuid nullable, `action` text, `entity` text, `entity_id` uuid nullable, `metadata` jsonb default '{}', `ip_address` text nullable, `created_at`
- Indexes: (user_id), (entity, entity_id), (created_at DESC)
- RLS: SELECT/INSERT super_admin only

### Funções auxiliares

**get_company_limits(company_id)**
- Security definer, retorna: max_users, max_storage_mb, max_uploads, current users count, current storage
- Usado para validação de limites no frontend

## Frontend — Estrutura de Arquivos

```text
src/
  pages/
    superadmin/
      SuperAdminDashboard.tsx   — métricas MRR, companies, churn
      SuperAdminCompanies.tsx   — lista + detalhes de companies
      SuperAdminPlans.tsx       — CRUD de planos
      SuperAdminSubscriptions.tsx — gestão de assinaturas
      SuperAdminAffiliates.tsx  — programa de afiliados
      SuperAdminTickets.tsx     — tickets de suporte
      SuperAdminLogs.tsx        — log global de auditoria
  components/
    superadmin/
      MetricCard.tsx            — card de métrica com ícone e valor
      CompanyDetailSheet.tsx    — sheet lateral com detalhes da company
      TicketThread.tsx          — thread de mensagens do ticket
  hooks/
    useSuperAdminStats.ts       — queries de métricas SaaS
    useSubscriptions.ts         — CRUD subscriptions
    useSupportTickets.ts        — CRUD tickets + messages
```

### Rotas (protegidas por isSuperAdmin)

| Rota | Componente |
|------|-----------|
| `/superadmin` | SuperAdminDashboard |
| `/superadmin/companies` | SuperAdminCompanies |
| `/superadmin/plans` | SuperAdminPlans |
| `/superadmin/subscriptions` | SuperAdminSubscriptions |
| `/superadmin/affiliates` | SuperAdminAffiliates |
| `/superadmin/tickets` | SuperAdminTickets |
| `/superadmin/logs` | SuperAdminLogs |

### Sidebar

Adicionar seção "Super Admin" no AppSidebar (condicional `isSuperAdmin`) com links para as rotas acima.

### Dashboard de Métricas

Cards com:
- Companies ativas (COUNT WHERE status='ativa')
- MRR (SUM plans.price_monthly WHERE subscriptions.status='ativo')
- Usuários totais (COUNT profiles)
- Tickets abertos (COUNT WHERE status='aberto')
- Crescimento mensal (companies criadas este mês vs anterior)

### Gestão de Companies

- Tabela com: nome, plano, status, usuários, storage, criado em
- Ações: suspender/ativar, alterar plano, ver detalhes
- Sheet lateral com informações completas

### Gestão de Planos

- CRUD completo de planos
- Campos: nome, preço, limites, flags whitelabel/domínio

### Tickets de Suporte

- Lista com filtros por status
- Abrir ticket → thread de mensagens
- Super admin responde diretamente

## Detalhes Técnicos

- Super admin global (sem company_id) — bypass via `has_role(auth.uid(), 'super_admin')`
- RLS: policies ALL para super_admin em todas as tabelas novas
- Companies só veem seus próprios dados de subscription/tickets
- `global_logs` restrito exclusivamente a super_admin
- Métricas calculadas via queries diretas (sem materialização por agora)
- Preparado para gateways: campos `gateway` e `external_id` em subscriptions

## Queries de Exemplo

```sql
-- MRR
SELECT SUM(p.price_monthly) as mrr
FROM subscriptions s JOIN plans p ON p.id = s.plan_id
WHERE s.status = 'ativo';

-- Companies ativas com plano
SELECT c.name, p.name as plan, s.status, c.active_users_count
FROM companies c
LEFT JOIN subscriptions s ON s.company_id = c.id
LEFT JOIN plans p ON p.id = s.plan_id
WHERE c.status = 'ativa';

-- Afiliados com conversões
SELECT ap.code, c.name, COUNT(ar.id) as referrals,
  COUNT(*) FILTER (WHERE ar.status = 'convertido') as converted
FROM affiliate_program ap
JOIN companies c ON c.id = ap.company_id
LEFT JOIN affiliate_referrals ar ON ar.affiliate_id = ap.id
GROUP BY ap.id, c.name;
```

## Ordem de Execução

1. Migração SQL (enums, tabelas, alterações, índices, RLS, função de limites)
2. Hooks de dados (useSuperAdminStats, useSubscriptions, useSupportTickets)
3. Componentes compartilhados (MetricCard, CompanyDetailSheet, TicketThread)
4. Páginas do painel (Dashboard, Companies, Plans, Subscriptions, Affiliates, Tickets, Logs)
5. Rotas + proteção isSuperAdmin
6. Integração no sidebar
7. Atualizar memória do projeto

