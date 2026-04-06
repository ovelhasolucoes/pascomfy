
INSERT INTO public.permissions (name, description) VALUES
  ('criar_evento', 'Criar novos eventos'),
  ('editar_escala', 'Editar escalas de equipe'),
  ('aprovar_video', 'Aprovar vídeos e conteúdos'),
  ('gerenciar_usuarios', 'Gerenciar usuários da company'),
  ('ver_relatorios', 'Visualizar relatórios'),
  ('editar_company', 'Editar dados da company')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'colaborador', id FROM public.permissions WHERE name IN ('criar_evento', 'editar_escala', 'ver_relatorios')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;
