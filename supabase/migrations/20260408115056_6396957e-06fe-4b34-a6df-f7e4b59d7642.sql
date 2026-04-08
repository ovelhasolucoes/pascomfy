
-- Criar bucket público para assets da plataforma (logos, favicons, backgrounds)
INSERT INTO storage.buckets (id, name, public)
VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: super_admin pode fazer tudo no bucket
CREATE POLICY "Super admin manages platform assets"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- Leitura pública (logos/favicons precisam ser acessíveis)
CREATE POLICY "Public reads platform assets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'platform-assets');
