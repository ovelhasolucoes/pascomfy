

# Pascomfy — Evolução do Sistema de Usuários e Permissões

## Resumo

Expansão do banco de dados com novos campos em profiles, sistema híbrido de permissões (role + granular), convites, logs de atividade, e UI de gestão de usuários para admins. Dividido em 3 migrações e ajustes no frontend.

## Migração 1: Esquema expandido

### ALTER profiles — novos campos
- `phone` text nullable
- `avatar_url` text nullable
- `status` enum `user_status` (ativo, inativo, bloqueado) default 'ativo'
- `last_access_at` timestamptz nullable
- `created_by` uuid nullable (ref auth.users)
- `permission_level` enum `permission_level` (basico, avancado) default 'basico'
- `reliability_score` float default 0
- `availability` jsonb default '{}'
- `settings` jsonb default '{}'

### Tabela `permissions`
- `id` uuid PK, `name` text unique, `description` text, `created_at`
- RLS: authenticated SELECT; super_admin ALL

### Tabela `role_permissions`
- `id` uuid PK, `role` app_role, `permission_id` FK→permissions, unique(role, permission_id)
- RLS: authenticated SELECT; super_admin ALL

### Tabela `user_permissions`
- `id` uuid PK, `user_id` FK→auth.users, `permission_id` FK→permissions, `allowed` boolean default true, `company_id` uuid FK→companies
- unique(user_id, permission_id)
- RLS: isolamento por company_id + super_admin

### Tabela `invites`
- `id` uuid PK, `email` text, `company_id` FK→companies, `role` app_role default 'colaborador', `token` uuid unique default gen_random_uuid(), `status` enum `invite_status` (pendente, aceito, expirado) default 'pendente', `created_by` FK→auth.users, `expires_at` timestamptz, `created_at`
- RLS: admin da company ou super_admin

### Tabela `activity_logs`
- `id` uuid PK, `user_id` FK→auth.users, `company_id` FK→companies, `action` text, `entity` text, `entity_id` uuid nullable, `metadata` jsonb default '{}', `created_at`
- RLS: admin da company (SELECT) + super_admin (ALL)
- Index em (company_id, created_at)

## Migração 2: Funções e RLS avançado

### Função `check_user_permission(user_id, permission_name)`
- SECURITY DEFINER
- Lógica: super_admin → true; verifica override em user_permissions; fallback para role_permissions
- Retorna boolean

### Função `is_active_user(user_id)`
- SECURITY DEFINER
- Retorna true se profiles.status = 'ativo'

### Atualização de RLS em todas as tabelas
- Adicionar verificação `is_active_user(auth.uid())` nas policies existentes de companies, profiles, user_roles
- Bloquear usuários inativos/bloqueados automaticamente

### Atualizar trigger `handle_new_user`
- Verificar se existe convite para o email → usar company_id e role do convite
- Marcar convite como 'aceito'
- Fallback: usar metadata como hoje

## Frontend — Páginas e componentes

### Hook `usePermissions`
- Busca roles e permissões do usuário logado
- Expõe `hasPermission(name)`, `hasRole(role)`, `isAdmin`, `isSuperAdmin`

### Página de Gestão de Usuários (`/admin/users`)
- Lista usuários da company (profiles + roles)
- Ações: ativar/desativar, alterar role, editar permissões
- Criar convite (email + role)
- Protegida por role admin

### Página de Aceitar Convite (`/invite/:token`)
- Valida token, mostra info da company
- Formulário de signup vinculado ao convite

### Atualizar AuthContext
- Incluir profile, role e permissões no contexto
- Atualizar `last_access_at` no login

### Seed de permissões iniciais
- Inserir permissões padrão: `criar_evento`, `editar_escala`, `aprovar_video`, `gerenciar_usuarios`, `ver_relatorios`, `editar_company`
- Vincular permissões às roles via role_permissions

## Detalhes Técnicos

```text
Fluxo de permissão:
  Request → is_active_user? → has_role(super_admin)? → bypass
                                    ↓ não
                            user_permissions override?
                                    ↓ não encontrado
                            role_permissions default
```

Estrutura do availability JSON:
```json
{
  "segunda": ["manha", "noite"],
  "quarta": ["noite"],
  "domingo": ["manha", "tarde"]
}
```

### Ordem de execução
1. Migração SQL (enums, tabelas, funções, RLS, trigger atualizado)
2. Seed de permissões via insert tool
3. Hook `usePermissions` + atualização do AuthContext
4. Páginas admin e convite
5. Atualizar memória do projeto

