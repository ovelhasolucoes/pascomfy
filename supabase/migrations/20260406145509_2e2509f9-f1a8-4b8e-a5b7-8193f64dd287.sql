
-- Enums
CREATE TYPE public.checklist_status AS ENUM ('pendente', 'concluido');
CREATE TYPE public.attendance_status AS ENUM ('presente', 'ausente');

-- checklist_templates
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_checklist_templates_company ON public.checklist_templates(company_id);

-- checklist_template_items (desnormalizado com company_id)
CREATE TABLE public.checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_checklist_template_items_template ON public.checklist_template_items(template_id);

-- event_checklists
CREATE TABLE public.event_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_team_id uuid REFERENCES public.event_teams(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_checklists_event ON public.event_checklists(event_id);
CREATE INDEX idx_event_checklists_company ON public.event_checklists(company_id);

-- event_checklist_items
CREATE TABLE public.event_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_checklist_id uuid NOT NULL REFERENCES public.event_checklists(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_checklist_items_checklist ON public.event_checklist_items(event_checklist_id);

-- event_checklist_progress
CREATE TABLE public.event_checklist_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_checklist_item_id uuid NOT NULL REFERENCES public.event_checklist_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.checklist_status NOT NULL DEFAULT 'pendente',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_checklist_item_id, user_id)
);
CREATE INDEX idx_checklist_progress_user ON public.event_checklist_progress(user_id, company_id);
CREATE INDEX idx_checklist_progress_item ON public.event_checklist_progress(event_checklist_item_id);

-- event_attendance
CREATE TABLE public.event_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'presente',
  checkin_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX idx_event_attendance_event ON public.event_attendance(event_id, company_id);
CREATE INDEX idx_event_attendance_user ON public.event_attendance(user_id);

-- RLS: checklist_templates
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view company checklist_templates" ON public.checklist_templates FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admin manages checklist_templates" ON public.checklist_templates FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'));

-- RLS: checklist_template_items
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view company checklist_template_items" ON public.checklist_template_items FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admin manages checklist_template_items" ON public.checklist_template_items FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'));

-- RLS: event_checklists
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view company event_checklists" ON public.event_checklists FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Permission manages event_checklists" ON public.event_checklists FOR ALL TO authenticated
  USING (check_user_permission(auth.uid(), 'editar_escala') AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (check_user_permission(auth.uid(), 'editar_escala') AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages all event_checklists" ON public.event_checklists FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS: event_checklist_items
ALTER TABLE public.event_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view company event_checklist_items" ON public.event_checklist_items FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Permission manages event_checklist_items" ON public.event_checklist_items FOR ALL TO authenticated
  USING (check_user_permission(auth.uid(), 'editar_escala') AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (check_user_permission(auth.uid(), 'editar_escala') AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages all event_checklist_items" ON public.event_checklist_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS: event_checklist_progress
ALTER TABLE public.event_checklist_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view company checklist_progress" ON public.event_checklist_progress FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "User inserts own progress" ON public.event_checklist_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "User updates own progress" ON public.event_checklist_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages all checklist_progress" ON public.event_checklist_progress FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS: event_attendance
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view company attendance" ON public.event_attendance FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "User inserts own attendance" ON public.event_attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "User updates own attendance" ON public.event_attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages all attendance" ON public.event_attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checklist_progress, public.event_attendance;
