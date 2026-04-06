---
name: Gamificação e Substituições
description: Sistema de pontos automáticos (triggers), níveis, ranking, e substituição de escalas com aprovação admin
type: feature
---
## Gamificação
- Tabelas: gamification_points (company_id, user_id, points, source), gamification_levels (company_id, name, min_points, icon)
- Triggers automáticos: on_attendance_gamification (presença → +pontos), on_checklist_gamification (checklist concluído → +pontos)
- Config via companies.settings jsonb: gamificacao_ativa, pontos_presenca, pontos_checklist, penalidade_falta
- Hook: useGamification.ts — pontos, level, ranking
- Admin settings tab "Gamificação" — toggle, valores, gerenciar níveis

## Substituições
- Tabela: event_substitutions (company_id, event_id, event_team_member_id, user_id, reason, status enum pendente/aprovado/rejeitado)
- Config: companies.settings.tempo_limite_substituicao (horas, default 24)
- Hook: useSubstitutions.ts — solicitar, listar, aprovar/rejeitar
- UI: botão "Substituir" em MySchedulePage com dialog de motivo

## Dashboard Unificado
- Rota / → DashboardPage.tsx (substituiu redirect para /events)
- Colaborador: próximos eventos, tarefas pendentes, pontos, ranking
- Admin: + stats (usuários ativos, eventos mês, substituições pendentes)

## Perfil Expandido
- Colunas adicionadas em profiles: bio, skills (jsonb), preferred_roles (jsonb)
- Rota /profile → ProfilePage.tsx — avatar upload, bio, habilidades, funções preferidas, disponibilidade semanal
