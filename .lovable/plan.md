

# Reestruturação Completa do Painel Super Admin

## Resumo

Criar um layout isolado para o Super Admin (sem sidebar/BottomNav de paróquia), reorganizar todos os módulos em 10 seções claras, criar página de detalhe de empresa com abas, e implementar impersonação via nova aba.

---

## Arquitetura de Navegação

```text
/superadmin                → Dashboard SaaS
/superadmin/companies      → Lista de empresas
/superadmin/companies/:id  → Detalhe da empresa (NOVA - com abas)
/superadmin/users          → Usuários super admin (NOVA)
/superadmin/plans          → Planos (já existe)
/superadmin/subscriptions  → Assinaturas (já existe)
/superadmin/payments       → Pagamentos (já existe)
/superadmin/domains        → Domínios (NOVA)
/superadmin/integrations   → Integrações globais (NOVA)
/superadmin/tickets        → Tickets (já existe)
/superadmin/affiliates     → Afiliados (já existe)
/superadmin/logs           → Logs (já existe)
/superadmin/settings       → Configurações globais (já existe)
```

---

## Implementação

### 1. Layout Separado — `SuperAdminLayout`

Novo componente que substitui `AppLayout` em todas as páginas `/superadmin/*`:

- **Sidebar própria** com apenas os 10+ módulos do Super Admin (sem Eventos, Agenda, Social, Perfil)
- **Sem BottomNav** de paróquia no mobile — usar sidebar collapsible ou drawer dedicado
- **Header** com indicador "Super Admin" + ThemeToggle + Logout
- Visual diferenciado (sidebar com fundo mais escuro ou accent diferente) para separar do contexto de paróquia

Todas as páginas `SuperAdmin*.tsx` atualmente importam `AppLayout` — trocar por `SuperAdminLayout`.

### 2. Dashboard SaaS (melhorar existente)

Adicionar métricas faltantes ao `useSuperAdminStats`:
- Empresas em trial (`status = 'ativa'` com `trial_until > now()`)
- Empresas inadimplentes (subscription `status = 'atrasado'`)

### 3. Página de Detalhe da Empresa — `SuperAdminCompanyDetail`

Nova página em `/superadmin/companies/:id` com 7 abas:

| Aba | Conteúdo |
|-----|----------|
| Geral | Nome, status, datas, block_mode (migrar do CompanyDetailSheet) |
| Plano | Plano atual, limites, upgrade/downgrade |
| Usuários | Lista de profiles da empresa, editar role, remover |
| Domínio | custom_domain, domain_verified, verificação |
| Integrações | WhatsApp config, Meta API da empresa |
| Uso | storage_used_mb, active_users_count, limites vs consumo |
| Ações | Bloquear empresa, resetar dados, **Entrar como empresa** |

O `CompanyDetailSheet` atual será removido — todo o conteúdo migra para essa página.

### 4. Usuários Super Admin — `SuperAdminUsers`

Nova página que lista apenas usuários com role `super_admin`:
- Query: `user_roles` WHERE `role = 'super_admin'` + JOIN `profiles`
- Adicionar/remover super admins

### 5. Domínios — `SuperAdminDomains`

Nova página que lista todas as companies com `custom_domain IS NOT NULL`:
- Status de verificação
- Ação de re-verificar

### 6. Integrações — `SuperAdminIntegrations`

Nova página para configurações globais de integração:
- Meta API (credentials globais)
- WhatsApp (Evo API / Oficial)
- Configurações que se aplicam a todas as companies

### 7. Impersonação — "Entrar como Empresa"

Na aba "Ações" do detalhe da empresa:
- Botão "Entrar como empresa"
- Gera um token temporário via Edge Function (`impersonate-company`)
- Abre nova aba/janela com `?impersonate_token=xxx`
- O sistema detecta o token, muda o contexto para a company selecionada
- Banner fixo no topo: "Visualizando como: [Empresa] — Sair"
- Ao clicar "Sair", fecha a aba

**Edge Function** `impersonate-company`:
- Valida que o usuário é super_admin
- Gera token JWT com company_id + expiry (30 min)
- Registra no `global_logs`

### 8. Atualizar Sidebar e MoreSheet

**Nova SuperAdminSidebar** com seções:

```text
─ VISÃO GERAL ─
  Dashboard
  
─ GESTÃO ─
  Empresas
  Usuários SA
  Planos
  
─ FINANCEIRO ─
  Assinaturas
  Pagamentos
  Afiliados

─ SUPORTE ─
  Tickets
  Domínios
  Integrações

─ SISTEMA ─
  Logs
  Configurações
```

**MoreSheet** no mobile: quando na área `/superadmin`, mostrar apenas itens do Super Admin (sem Admin/paróquia).

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/superadmin/SuperAdminLayout.tsx` | Layout isolado (sidebar + header) |
| `src/components/superadmin/SuperAdminSidebar.tsx` | Sidebar dedicada |
| `src/pages/superadmin/SuperAdminCompanyDetail.tsx` | Página com abas para detalhe |
| `src/pages/superadmin/SuperAdminUsers.tsx` | Usuários super admin |
| `src/pages/superadmin/SuperAdminDomains.tsx` | Domínios globais |
| `src/pages/superadmin/SuperAdminIntegrations.tsx` | Integrações globais |
| `supabase/functions/impersonate-company/index.ts` | Edge function para impersonação |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Novas rotas, rota dinâmica `:id` |
| Todas as `SuperAdmin*.tsx` | Trocar `AppLayout` por `SuperAdminLayout` |
| `src/components/layout/MoreSheet.tsx` | Separar contextos |
| `src/components/layout/AppSidebar.tsx` | Remover seção Super Admin (agora é layout separado) |
| `src/hooks/useSuperAdminStats.ts` | Adicionar trial/inadimplentes |

## Banco de Dados

Nenhuma migration necessária — todas as tabelas já existem. A impersonação usa token JWT gerado pela Edge Function.

---

## Ordem de Implementação

1. `SuperAdminLayout` + `SuperAdminSidebar` (base)
2. Trocar todas as páginas para o novo layout
3. Remover Super Admin do `AppSidebar` e `MoreSheet`
4. `SuperAdminCompanyDetail` com abas (migrar CompanyDetailSheet)
5. `SuperAdminUsers`, `SuperAdminDomains`, `SuperAdminIntegrations`
6. Melhorar Dashboard (métricas faltantes)
7. Impersonação (Edge Function + UI)

