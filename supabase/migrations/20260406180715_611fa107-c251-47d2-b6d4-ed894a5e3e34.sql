-- Add white label columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS domain_verified boolean NOT NULL DEFAULT false;

-- Unique partial index on custom_domain (only where not null)
CREATE UNIQUE INDEX IF NOT EXISTS companies_custom_domain_unique
  ON public.companies (custom_domain)
  WHERE custom_domain IS NOT NULL;

-- Anon can resolve company by custom_domain (limited columns via app logic)
CREATE POLICY "Anon resolves company by domain"
  ON public.companies
  FOR SELECT
  TO anon
  USING (custom_domain IS NOT NULL AND domain_verified = true);