
-- Create biolink_templates table (global or per-company)
CREATE TABLE public.biolink_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  categoria text NOT NULL DEFAULT 'geral',
  preview_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create biolink_template_items table
CREATE TABLE public.biolink_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.biolink_templates(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  tipo text NOT NULL DEFAULT 'link',
  icone text,
  ordem integer NOT NULL DEFAULT 0,
  url_placeholder text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for biolink_templates
ALTER TABLE public.biolink_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biolink_template_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view global templates (company_id IS NULL)
CREATE POLICY "Anyone views global templates"
  ON public.biolink_templates FOR SELECT
  TO authenticated
  USING (company_id IS NULL);

-- Members view own company templates
CREATE POLICY "Members view company templates"
  ON public.biolink_templates FOR SELECT
  TO authenticated
  USING (company_id IS NOT NULL AND company_id = get_user_company_id(auth.uid()));

-- Admin manages company templates
CREATE POLICY "Admin manages company templates"
  ON public.biolink_templates FOR ALL
  TO authenticated
  USING (
    (company_id IS NOT NULL AND has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (company_id IS NOT NULL AND has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

-- Super admin manages global templates
CREATE POLICY "Super admin manages global templates"
  ON public.biolink_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Template items: viewable if template is viewable
CREATE POLICY "View template items"
  ON public.biolink_template_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.biolink_templates t
      WHERE t.id = biolink_template_items.template_id
        AND (t.company_id IS NULL OR t.company_id = get_user_company_id(auth.uid()))
    )
  );

-- Admin/super_admin manage template items
CREATE POLICY "Admin manages template items"
  ON public.biolink_template_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.biolink_templates t
      WHERE t.id = biolink_template_items.template_id
        AND (
          (t.company_id IS NOT NULL AND has_role(auth.uid(), 'admin') AND t.company_id = get_user_company_id(auth.uid()))
          OR has_role(auth.uid(), 'super_admin')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.biolink_templates t
      WHERE t.id = biolink_template_items.template_id
        AND (
          (t.company_id IS NOT NULL AND has_role(auth.uid(), 'admin') AND t.company_id = get_user_company_id(auth.uid()))
          OR has_role(auth.uid(), 'super_admin')
        )
    )
  );
