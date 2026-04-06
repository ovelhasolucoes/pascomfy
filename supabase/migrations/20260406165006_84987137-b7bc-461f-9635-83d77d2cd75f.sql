
DROP VIEW IF EXISTS public.social_accounts_safe;
CREATE VIEW public.social_accounts_safe
WITH (security_invoker = true) AS
SELECT id, company_id, provider, app_id, page_id, page_name, instagram_id, instagram_username, status, created_at, token_expires_at
FROM public.social_accounts;
