
-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: social_accounts
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'meta',
  app_id text NOT NULL,
  app_secret_encrypted text NOT NULL,
  access_token text,
  token_expires_at timestamptz,
  page_id text,
  page_name text,
  instagram_id text,
  instagram_username text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: social_posts
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  caption text,
  media_type text,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  platform text NOT NULL DEFAULT 'facebook',
  status text NOT NULL DEFAULT 'rascunho',
  error_message text,
  scheduled_at timestamptz,
  published_at timestamptz,
  meta_post_id text,
  meta_ig_post_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_social_accounts_company ON public.social_accounts(company_id);
CREATE INDEX idx_social_posts_company_status ON public.social_posts(company_id, status);
CREATE INDEX idx_social_posts_scheduled ON public.social_posts(company_id, scheduled_at) WHERE status = 'agendado';

-- Safe view (no tokens/secrets)
CREATE VIEW public.social_accounts_safe AS
SELECT id, company_id, provider, app_id, page_id, page_name, instagram_id, instagram_username, status, created_at,
  token_expires_at
FROM public.social_accounts;

-- RLS for social_accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages company social_accounts"
ON public.social_accounts FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- RLS for social_posts
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company social_posts"
ON public.social_posts FOR SELECT TO authenticated
USING (
  is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Admin manages company social_posts"
ON public.social_posts FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Service role for edge functions
CREATE POLICY "Service role manages social_accounts"
ON public.social_accounts FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages social_posts"
ON public.social_posts FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Storage bucket for temporary media
INSERT INTO storage.buckets (id, name, public) VALUES ('social-temp', 'social-temp', true);

CREATE POLICY "Admin uploads social temp files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'social-temp'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone reads social temp files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'social-temp');

CREATE POLICY "Admin deletes social temp files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'social-temp'
  AND has_role(auth.uid(), 'admin'::app_role)
);
