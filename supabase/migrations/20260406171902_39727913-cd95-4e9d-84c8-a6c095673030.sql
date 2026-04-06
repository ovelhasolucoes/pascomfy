
-- Enum for biolink item types
CREATE TYPE public.biolink_item_type AS ENUM ('link', 'whatsapp', 'youtube', 'instagram', 'facebook', 'doacao');

-- Main biolinks table
CREATE TABLE public.biolinks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  logo_url text,
  cor_primaria text NOT NULL DEFAULT '#6366f1',
  cor_secundaria text NOT NULL DEFAULT '#8b5cf6',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT biolinks_slug_unique UNIQUE (slug)
);

-- Biolink items table
CREATE TABLE public.biolink_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  biolink_id uuid NOT NULL REFERENCES public.biolinks(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  url text NOT NULL,
  tipo public.biolink_item_type NOT NULL DEFAULT 'link',
  icone text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Click tracking table
CREATE TABLE public.biolink_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  biolink_item_id uuid NOT NULL REFERENCES public.biolink_items(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referer text
);

-- Indexes
CREATE INDEX idx_biolink_items_order ON public.biolink_items(biolink_id, ordem);
CREATE INDEX idx_biolink_clicks_item ON public.biolink_clicks(biolink_item_id, clicked_at);
CREATE INDEX idx_biolinks_slug ON public.biolinks(slug);

-- RLS: biolinks
ALTER TABLE public.biolinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages company biolinks"
  ON public.biolinks FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Members view company biolinks"
  ON public.biolinks FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Anon views active biolinks"
  ON public.biolinks FOR SELECT TO anon
  USING (ativo = true);

-- RLS: biolink_items
ALTER TABLE public.biolink_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages company biolink_items"
  ON public.biolink_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.biolinks b
      WHERE b.id = biolink_items.biolink_id
        AND ((has_role(auth.uid(), 'admin') AND b.company_id = get_user_company_id(auth.uid()))
             OR has_role(auth.uid(), 'super_admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.biolinks b
      WHERE b.id = biolink_items.biolink_id
        AND ((has_role(auth.uid(), 'admin') AND b.company_id = get_user_company_id(auth.uid()))
             OR has_role(auth.uid(), 'super_admin'))
    )
  );

CREATE POLICY "Members view company biolink_items"
  ON public.biolink_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.biolinks b
      WHERE b.id = biolink_items.biolink_id
        AND is_active_user(auth.uid())
        AND b.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Anon views active biolink_items"
  ON public.biolink_items FOR SELECT TO anon
  USING (
    ativo = true AND EXISTS (
      SELECT 1 FROM public.biolinks b
      WHERE b.id = biolink_items.biolink_id AND b.ativo = true
    )
  );

-- RLS: biolink_clicks
ALTER TABLE public.biolink_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role inserts clicks"
  ON public.biolink_clicks FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Admin views company clicks"
  ON public.biolink_clicks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.biolink_items bi
      JOIN public.biolinks b ON b.id = bi.biolink_id
      WHERE bi.id = biolink_clicks.biolink_item_id
        AND ((has_role(auth.uid(), 'admin') AND b.company_id = get_user_company_id(auth.uid()))
             OR has_role(auth.uid(), 'super_admin'))
    )
  );
