
-- Enums
CREATE TYPE public.event_status AS ENUM ('ativo', 'cancelado');
CREATE TYPE public.member_status AS ENUM ('pendente', 'confirmado', 'ausente', 'substituido');

-- event_types: tipos dinâmicos por company
CREATE TABLE public.event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- team_templates: templates reutilizáveis de equipe
CREATE TABLE public.team_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type_id uuid REFERENCES public.event_types(id) ON DELETE SET NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  location text,
  status public.event_status NOT NULL DEFAULT 'ativo',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_company_start ON public.events(company_id, start_date);
CREATE INDEX idx_events_company_status ON public.events(company_id, status);

-- event_teams
CREATE TABLE public.event_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.team_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  color text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_teams_event ON public.event_teams(event_id);

-- event_team_members (escala)
CREATE TABLE public.event_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_team_id uuid NOT NULL REFERENCES public.event_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.member_status NOT NULL DEFAULT 'pendente',
  role_name text,
  role_description text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_team_id, user_id)
);
CREATE INDEX idx_etm_user_company ON public.event_team_members(user_id, company_id);
CREATE INDEX idx_etm_team ON public.event_team_members(event_team_id);

-- ===================== RLS POLICIES =====================

-- event_types
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company event_types" ON public.event_types
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin manages company event_types" ON public.event_types
  FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

-- team_templates
ALTER TABLE public.team_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company team_templates" ON public.team_templates
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin manages company team_templates" ON public.team_templates
  FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

-- events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company events" ON public.events
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users with permission create events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    check_user_permission(auth.uid(), 'criar_evento')
    AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Users with permission update events" ON public.events
  FOR UPDATE TO authenticated
  USING (
    check_user_permission(auth.uid(), 'criar_evento')
    AND company_id = get_user_company_id(auth.uid())
  )
  WITH CHECK (
    check_user_permission(auth.uid(), 'criar_evento')
    AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Admin or super_admin delete events" ON public.events
  FOR DELETE TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

-- event_teams
ALTER TABLE public.event_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company event_teams" ON public.event_teams
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users with permission manage event_teams" ON public.event_teams
  FOR ALL TO authenticated
  USING (
    check_user_permission(auth.uid(), 'editar_escala')
    AND company_id = get_user_company_id(auth.uid())
  )
  WITH CHECK (
    check_user_permission(auth.uid(), 'editar_escala')
    AND company_id = get_user_company_id(auth.uid())
  );

-- event_team_members
ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company event_team_members" ON public.event_team_members
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Self-confirm presence" ON public.event_team_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_active_user(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND is_active_user(auth.uid()));

CREATE POLICY "Permission manages event_team_members insert" ON public.event_team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    check_user_permission(auth.uid(), 'editar_escala')
    AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Permission manages event_team_members delete" ON public.event_team_members
  FOR DELETE TO authenticated
  USING (
    check_user_permission(auth.uid(), 'editar_escala')
    AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Super admin manages all event_team_members" ON public.event_team_members
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));
