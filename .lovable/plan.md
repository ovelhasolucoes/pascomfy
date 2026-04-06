

# Pascomfy — Arquitetura Multi-Tenant SaaS

## Visão Geral da Arquitetura

Sistema multi-tenant onde cada paróquia (company) tem dados completamente isolados via RLS. Um `super_admin` global pode acessar tudo.

```
auth.users → profiles (1:1) → company (N:1)
                ↓
          user_roles (1:N) — roles: colaborador, admin, super_admin
```

## 1. Estrutura do Banco de Dados

### Tabela `plans`
- `id`, `name` (free, basic, premium), `max_users`, `max_storage_mb`, `created_at`
- Preparação para limites futuros por company

### Tabela `companies`
- `id`, `name`, `logo_url`, `primary_color`, `secondary_color`, `plan_id` (FK → plans), `created_at`

### Tabela `profiles`
- `id` (FK → auth.users ON DELETE CASCADE), `company_id` (FK → companies, NOT NULL), `name`, `email`, `created_at`
- **Sem campo role** — roles ficam em tabela separada por segurança

### Tabela `user_roles`
- `id`, `user_id` (FK → auth.users), `role` (enum: colaborador, admin, super_admin), unique(user_id, role)
- Separada para evitar privilege escalation

### Funções de Segurança (SECURITY DEFINER)
- `has_role(user_id, role)` — verifica se usuário tem um role específico
- `get_user_company_id(user_id)` — retorna o company_id do usuário
- Ambas com `SECURITY DEFINER` para evitar recursão infinita no RLS

### Trigger automático
- Ao criar usuário no auth.users → cria profile automaticamente com dados do metadata (company_id, name)

## 2. Políticas RLS (Row Level Security)

Todas as tabelas terão RLS ativado. Lógica base:

- **SELECT**: usuário vê apenas dados da sua company OU é super_admin
- **INSERT**: usuário só insere com seu próprio company_id OU é super_admin
- **UPDATE**: admin da company pode atualizar dados da company OU super_admin
- **DELETE**: apenas admin da company ou super_admin

### Tabelas afetadas:
- `companies` — admin vê/edita sua company, super_admin vê todas
- `profiles` — usuário vê colegas da mesma company
- `user_roles` — apenas admin/super_admin gerencia roles

## 3. Autenticação
- Login com email/senha via Supabase Auth
- No signup, `company_id` é passado via metadata e o trigger cria o profile automaticamente
- Role padrão: `colaborador`

## 4. Página de Login
- Tela de login com email e senha
- Estilo clean com branding "Pascomfy"
- Redirecionamento pós-login para página inicial (placeholder)

## 5. Preparação SaaS
- Tabela `plans` com campos de limites (max_users, max_storage)
- `companies.plan_id` para associar planos
- Seeds iniciais com 3 planos: Free, Basic, Premium

