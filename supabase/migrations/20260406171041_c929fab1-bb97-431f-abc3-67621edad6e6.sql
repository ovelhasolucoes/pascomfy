
CREATE TABLE public.social_post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;

-- Members can view metrics of their company
CREATE POLICY "Members view company metrics"
  ON public.social_post_metrics
  FOR SELECT
  TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

-- Service role manages metrics (edge function)
CREATE POLICY "Service role manages metrics"
  ON public.social_post_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Super admin manages all
CREATE POLICY "Super admin manages metrics"
  ON public.social_post_metrics
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
