-- 1) INVITES: remover SELECT público e criar função segura por token
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.invites;

CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  email text,
  company_id uuid,
  role public.app_role,
  status public.invite_status,
  expires_at timestamptz,
  company_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.company_id, i.role, i.status, i.expires_at, c.name AS company_name
  FROM public.invites i
  LEFT JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = _token
    AND i.status = 'pendente'
    AND i.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid) TO anon, authenticated;

-- 2) REALTIME: políticas em realtime.messages
-- Permite somente subscribe a tópicos no formato "user:<uid>" ou "company:<company_id_do_usuario>"
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users subscribe own topics" ON realtime.messages;
CREATE POLICY "Authenticated users subscribe own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'user:' || auth.uid()::text
  OR realtime.topic() = 'company:' || COALESCE(public.get_user_company_id(auth.uid())::text, '')
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

DROP POLICY IF EXISTS "Authenticated users broadcast own topics" ON realtime.messages;
CREATE POLICY "Authenticated users broadcast own topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'user:' || auth.uid()::text
  OR realtime.topic() = 'company:' || COALESCE(public.get_user_company_id(auth.uid())::text, '')
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- 3) BUCKETS PÚBLICOS: restringir SELECT para impedir listing
-- Mantém leitura de arquivos individuais via URL pública, mas sem listar o bucket inteiro
DROP POLICY IF EXISTS "Public read social-temp" ON storage.objects;
CREATE POLICY "Public read social-temp"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'social-temp' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Public read platform-assets" ON storage.objects;
CREATE POLICY "Public read platform-assets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] IS NOT NULL);

-- 4) GLOBAL_LOGS: permitir INSERT por service_role e por usuários autenticados (com user_id = auth.uid)
DROP POLICY IF EXISTS "Service role inserts global logs" ON public.global_logs;
CREATE POLICY "Service role inserts global logs"
ON public.global_logs
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated inserts own global logs" ON public.global_logs;
CREATE POLICY "Authenticated inserts own global logs"
ON public.global_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
