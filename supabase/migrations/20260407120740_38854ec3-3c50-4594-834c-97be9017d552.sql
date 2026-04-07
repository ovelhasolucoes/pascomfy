
INSERT INTO public.biolink_templates (id, nome, descricao, categoria, preview_config) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Paróquia Padrão', 'Template completo para paróquias com links essenciais', 'igreja', '{"icon":"church"}'),
  ('a1000000-0000-0000-0000-000000000002', 'Social', 'Links para redes sociais da comunidade', 'social', '{"icon":"share2"}'),
  ('a1000000-0000-0000-0000-000000000003', 'Transmissão', 'Template focado em lives e transmissões', 'transmissao', '{"icon":"video"}'),
  ('a1000000-0000-0000-0000-000000000004', 'Doações', 'Template focado em arrecadação e doações', 'doacao', '{"icon":"heart"}'),
  ('a1000000-0000-0000-0000-000000000005', 'Minimalista', 'Template simples e direto ao ponto', 'geral', '{"icon":"sparkles"}');

INSERT INTO public.biolink_template_items (template_id, titulo, tipo, ordem, url_placeholder) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'WhatsApp da Paróquia', 'whatsapp', 0, 'https://wa.me/55...'),
  ('a1000000-0000-0000-0000-000000000001', 'Instagram', 'instagram', 1, 'https://instagram.com/...'),
  ('a1000000-0000-0000-0000-000000000001', 'Facebook', 'facebook', 2, 'https://facebook.com/...'),
  ('a1000000-0000-0000-0000-000000000001', 'YouTube - Transmissões', 'youtube', 3, 'https://youtube.com/@...'),
  ('a1000000-0000-0000-0000-000000000001', 'Contribua com a Paróquia', 'doacao', 4, 'https://...'),
  ('a1000000-0000-0000-0000-000000000001', 'Site Oficial', 'link', 5, 'https://...'),
  ('a1000000-0000-0000-0000-000000000002', 'Instagram', 'instagram', 0, 'https://instagram.com/...'),
  ('a1000000-0000-0000-0000-000000000002', 'Facebook', 'facebook', 1, 'https://facebook.com/...'),
  ('a1000000-0000-0000-0000-000000000002', 'YouTube', 'youtube', 2, 'https://youtube.com/@...'),
  ('a1000000-0000-0000-0000-000000000002', 'WhatsApp', 'whatsapp', 3, 'https://wa.me/55...'),
  ('a1000000-0000-0000-0000-000000000003', 'Assistir ao Vivo', 'youtube', 0, 'https://youtube.com/live/...'),
  ('a1000000-0000-0000-0000-000000000003', 'Canal no YouTube', 'youtube', 1, 'https://youtube.com/@...'),
  ('a1000000-0000-0000-0000-000000000003', 'Instagram Live', 'instagram', 2, 'https://instagram.com/...'),
  ('a1000000-0000-0000-0000-000000000003', 'Programação', 'link', 3, 'https://...'),
  ('a1000000-0000-0000-0000-000000000004', 'Dízimo Online', 'doacao', 0, 'https://...'),
  ('a1000000-0000-0000-0000-000000000004', 'Campanha Solidária', 'doacao', 1, 'https://...'),
  ('a1000000-0000-0000-0000-000000000004', 'PIX da Paróquia', 'link', 2, 'https://...'),
  ('a1000000-0000-0000-0000-000000000004', 'WhatsApp - Dúvidas', 'whatsapp', 3, 'https://wa.me/55...'),
  ('a1000000-0000-0000-0000-000000000005', 'Site', 'link', 0, 'https://...'),
  ('a1000000-0000-0000-0000-000000000005', 'WhatsApp', 'whatsapp', 1, 'https://wa.me/55...'),
  ('a1000000-0000-0000-0000-000000000005', 'Instagram', 'instagram', 2, 'https://instagram.com/...');
