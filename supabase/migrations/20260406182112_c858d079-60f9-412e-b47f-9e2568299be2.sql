
-- 1. Expand profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_roles jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Create substitution_status enum
CREATE TYPE public.substitution_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- 3. Create event_substitutions table
CREATE TABLE public.event_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_team_member_id uuid NOT NULL REFERENCES public.event_team_members(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status public.substitution_status NOT NULL DEFAULT 'pendente',
  responded_by uuid REFERENCES public.profiles(id),
  responded_at timestamptz,
  replacement_user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_substitutions_event_user ON public.event_substitutions(event_id, user_id);
CREATE INDEX idx_event_substitutions_company ON public.event_substitutions(company_id);

-- RLS for event_substitutions
ALTER TABLE public.event_substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own substitutions" ON public.event_substitutions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "User creates own substitution" ON public.event_substitutions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin manages company substitutions" ON public.event_substitutions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Super admin manages all substitutions" ON public.event_substitutions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 4. Create gamification_points table
CREATE TABLE public.gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  source text NOT NULL,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gamification_points_company_user ON public.gamification_points(company_id, user_id);
CREATE INDEX idx_gamification_points_source ON public.gamification_points(source, source_id);

ALTER TABLE public.gamification_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company points" ON public.gamification_points
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Super admin manages all points" ON public.gamification_points
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 5. Create gamification_levels table
CREATE TABLE public.gamification_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_points integer NOT NULL DEFAULT 0,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company levels" ON public.gamification_levels
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admin manages company levels" ON public.gamification_levels
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Super admin manages all levels" ON public.gamification_levels
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 6. Trigger: award points on attendance checkin
CREATE OR REPLACE FUNCTION public.on_attendance_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _settings jsonb;
  _active boolean;
  _points integer;
BEGIN
  SELECT settings INTO _settings FROM public.companies WHERE id = NEW.company_id;
  _active := COALESCE((_settings->>'gamificacao_ativa')::boolean, false);
  IF NOT _active THEN RETURN NEW; END IF;
  _points := COALESCE((_settings->>'pontos_presenca')::integer, 10);
  
  INSERT INTO public.gamification_points (company_id, user_id, points, source, source_id)
  VALUES (NEW.company_id, NEW.user_id, _points, 'presenca', NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_gamification
  AFTER INSERT ON public.event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.on_attendance_gamification();

-- 7. Trigger: award points on checklist completion
CREATE OR REPLACE FUNCTION public.on_checklist_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _settings jsonb;
  _active boolean;
  _points integer;
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    SELECT settings INTO _settings FROM public.companies WHERE id = NEW.company_id;
    _active := COALESCE((_settings->>'gamificacao_ativa')::boolean, false);
    IF NOT _active THEN RETURN NEW; END IF;
    _points := COALESCE((_settings->>'pontos_checklist')::integer, 5);
    
    INSERT INTO public.gamification_points (company_id, user_id, points, source, source_id)
    VALUES (NEW.company_id, NEW.user_id, _points, 'checklist', NEW.event_checklist_item_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checklist_gamification
  AFTER INSERT OR UPDATE ON public.event_checklist_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.on_checklist_gamification();
