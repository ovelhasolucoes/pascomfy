CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins_manage_platform_settings"
ON public.platform_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.platform_settings (key, value, category) VALUES
  ('branding', '{"app_name": "Pascomfy", "logo_url": null, "favicon_url": null, "primary_color": "#7c3aed", "secondary_color": "#6d28d9"}', 'branding'),
  ('pwa', '{"short_name": "Pascomfy", "description": "Organize, sirva e comunique com excelência", "theme_color": "#7c3aed", "background_color": "#0f172a"}', 'branding'),
  ('login', '{"background_url": null, "welcome_title": "Bem-vindo ao Pascomfy", "welcome_subtitle": "Organize, sirva e comunique com excelência", "auth_methods": {"email": true, "google": false}}', 'login'),
  ('payment_gateways', '{"asaas": {"enabled": false, "mode": "sandbox", "api_key": null, "webhook_secret": null}, "mercadopago": {"enabled": false, "mode": "sandbox", "access_token": null, "webhook_secret": null}}', 'gateways'),
  ('email', '{"smtp_host": null, "smtp_port": 587, "smtp_user": null, "smtp_from": null, "smtp_from_name": "Pascomfy"}', 'notifications'),
  ('whatsapp', '{"default_provider": "meta", "meta_app_id": null, "evo_api_url": null}', 'notifications'),
  ('announcements', '{"items": []}', 'announcements')
ON CONFLICT (key) DO NOTHING;