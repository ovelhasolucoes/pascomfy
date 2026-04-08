
UPDATE platform_settings SET value = jsonb_build_object(
  'app_name', COALESCE(value->>'app_name', 'Pascomfy'),
  'logo_url', value->'logo_url',
  'favicon_url', value->'favicon_url',
  'primary_color', '#c4a983',
  'secondary_color', '#8b7355'
), updated_at = now() WHERE key = 'branding';

UPDATE platform_settings SET value = jsonb_build_object(
  'short_name', COALESCE(value->>'short_name', 'Pascomfy'),
  'description', COALESCE(value->>'description', ''),
  'theme_color', '#c4a983',
  'background_color', '#1A1816'
), updated_at = now() WHERE key = 'pwa';
