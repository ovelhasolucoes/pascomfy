
-- 1. company-files UPDATE policy
CREATE POLICY "Company members update files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-files' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text)
WITH CHECK (bucket_id = 'company-files' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- 2. global_logs: tighten INSERT
DROP POLICY IF EXISTS "Authenticated inserts own global logs" ON public.global_logs;
CREATE POLICY "Authenticated inserts own global logs"
ON public.global_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. social_accounts: hide tokens from authenticated reads
REVOKE SELECT (access_token, app_secret_encrypted) ON public.social_accounts FROM authenticated;
-- Keep full access for service_role (already has ALL)

-- 4. social-temp bucket: enforce company folder ownership
DROP POLICY IF EXISTS "Admin uploads social temp files" ON storage.objects;
DROP POLICY IF EXISTS "Admin deletes social temp files" ON storage.objects;

CREATE POLICY "Admin uploads social temp files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'social-temp'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);

CREATE POLICY "Admin deletes social temp files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'social-temp'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);

-- 5. Remove overly permissive public-listing SELECT policies on public buckets
DROP POLICY IF EXISTS "Anyone reads social temp files" ON storage.objects;
DROP POLICY IF EXISTS "Public reads platform assets" ON storage.objects;
