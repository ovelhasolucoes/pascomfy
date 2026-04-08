

# Refatoração UX Completa do Pascomfy

## Resumo

Redesign total da interface com nova paleta baseada em **#c4a983**, redução drástica de elementos visuais, e foco em clareza para usuários leigos. O sistema deve parecer "leve e acolhedor", não "corporativo pesado".

---

## 1. Nova Paleta de Cores

Substituir todo o sistema de cores CSS (light + dark) em `src/index.css`:

| Token | Light | Dark |
|-------|-------|------|
| **primary** | `#c4a983` (bege dourado) | `#d4b993` (mais claro) |
| **background** | `#FAFAF8` (off-white quente) | `#1A1816` (marrom escuro) |
| **card** | `#FFFFFF` | `#222019` |
| **muted** | `#F5F0EB` (bege claro) | `#2A2723` |
| **border** | `#E8E0D8` | `#3A3530` |
| **foreground** | `#2D2A26` (marrom escuro) | `#F0EBE5` |
| **sidebar** | tons harmoniosos com a paleta | idem |

Remover azul completamente. Toda a identidade visual passa a ser quente e elegante.

---

## 2. Dashboard - Simplificação Radical

**Problema**: 10+ cards competindo atenção (stats, quick actions, eventos, tarefas, gamificação, ranking, gráficos, top performers, top ausências).

**Solução - Voluntário (não-admin)**:
- Saudação simples (sem card, só texto)
- **1 card principal**: Próximo evento com botão "Confirmar presença" grande
- **1 card secundário**: Tarefas pendentes (se houver)
- Gamificação: apenas uma linha sutil com pontos/nível (não um card inteiro)
- Remover: QuickActions card, AttendanceHistory, gráficos

**Solução - Admin**:
- Mesma saudação
- 2 stat cards essenciais (eventos no mês + substituições pendentes)
- Lista de próximos eventos
- Gráfico de presença (colapsável, não visível por padrão)
- Remover: top performers, top absences do dashboard (mover para relatórios)

---

## 3. Navegação - Menos Opções Visíveis

**Bottom Nav (mobile)**: Manter como está (Home, Eventos, Agenda, Perfil, Mais) - já está bom.

**Sidebar (desktop)**: 
- Remover collapsible groups - mostrar itens diretamente, flat
- Admin: reduzir para 4 itens essenciais (Usuários, Notificações, Assinatura, Configurações)
- Mover Biolink, Indicações, Substituições para dentro de Configurações como abas
- Social: agrupar em 1 item "Social" que abre a página com abas internas

**MoreSheet (mobile)**:
- Mesma redução de itens
- Ícones maiores, mais espaço entre itens

---

## 4. Tela de Login - Mais Acolhedora

- Adicionar sutil gradiente de fundo com tons da nova paleta
- Logo/nome do sistema maior e mais elegante
- Remover "Gestão de equipes da Pascom" - substituir por algo mais acolhedor: "Bem-vindo de volta"
- Inputs mais espaçados
- Botão "Entrar" com cor primária #c4a983

---

## 5. Página de Eventos - Foco no Calendário

- Manter calendário como está (já limpo)
- Simplificar filtros: apenas tipo de evento, remover filtro de status
- Botão "Criar evento" mais visível (FAB no mobile)

---

## 6. Detalhe do Evento - Reduzir Seções

**Problema**: Header + Info + Equipes + Presença + Checklist + Modo Foco = muitas seções.

**Solução**:
- Usar abas/tabs: "Resumo" | "Equipes" | "Presença" | "Checklist"
- Cada aba mostra apenas seu conteúdo
- Remover botão "Modo Foco" gigante do final (mover para header como ícone)
- Info do evento: simplificar, menos separadores

---

## 7. Minha Agenda - Cards Mais Limpos

- Remover badges duplicados (status + "Em breve" + substituição)
- Manter apenas: nome do evento, data/hora, e 1 botão de ação principal
- Botão "Confirmar" = primário grande
- Botão "Não posso ir" = texto simples (não botão outline)

---

## 8. Perfil - Menos Campos Visíveis

**Problema**: 4 cards separados (Info, Habilidades, Funções, Disponibilidade) + QR Code.

**Solução**:
- 1 card único com avatar + nome + telefone + bio
- Habilidades e funções: colapsáveis (iniciam fechados)
- Disponibilidade: simplificar tabela (botões menores, grid mais compacto)
- QR Code: mover para um botão "Meu QR Code" que abre modal

---

## 9. Componentes Base - Ajustes Globais

**Cards**: remover `hover:shadow-md`, usar sombra sutil fixa. Border mais suave.

**Botões**: texto mais curto, ícone à esquerda sempre. Primário = preenchido com #c4a983. Secundário = ghost/texto.

**PageHeader**: remover `description` na maioria das telas (informação redundante). Apenas título.

**StatCard**: maior, menos denso, ícone menor.

**Espaçamento**: aumentar gap entre seções de `space-y-6` para `space-y-8`.

---

## 10. Tipografia e Espaçamento

- Títulos: `font-semibold` em vez de `font-bold` (mais suave)
- Reduzir uso de `text-xs` - mínimo `text-sm`
- Mais `whitespace` entre elementos
- Remover ícones decorativos desnecessários nos títulos de cards

---

## Arquivos Principais Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Nova paleta completa (light + dark) |
| `src/pages/DashboardPage.tsx` | Simplificação radical, menos cards |
| `src/pages/EventDetailPage.tsx` | Tabs, menos seções visíveis |
| `src/pages/MySchedulePage.tsx` | Cards mais limpos |
| `src/pages/ProfilePage.tsx` | Campos colapsáveis |
| `src/pages/Login.tsx` | Visual acolhedor |
| `src/components/layout/AppSidebar.tsx` | Menu flat, menos itens |
| `src/components/layout/MoreSheet.tsx` | Menos itens |
| `src/components/dashboard/QuickActions.tsx` | Remover ou simplificar |
| `src/components/ui/page-header.tsx` | Opcional: esconder description |
| `src/components/ui/card.tsx` | Sombra/border mais suave |
| `src/components/ui/stat-card.tsx` | Mais espaçado |

---

## Ordem de Implementação

1. **Paleta de cores** (index.css) - muda tudo de uma vez
2. **Dashboard** - tela principal, maior impacto
3. **Login** - primeira impressão
4. **Navegação** (Sidebar + MoreSheet) - reduzir opções
5. **Componentes base** (cards, buttons, headers)
6. **Telas internas** (eventos, agenda, perfil)

---

## O que NAO mudar

- Bottom Nav mobile (já está bom)
- Estrutura de rotas
- Lógica de negócio / hooks
- Funcionalidades existentes (apenas esconder complexidade, não remover)

