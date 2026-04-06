
-- 1. Create new enums
CREATE TYPE public.user_status AS ENUM ('ativo', 'inativo', 'bloqueado');
CREATE TYPE public.permission_level AS ENUM ('basico', 'avancado');
CREATE TYPE public.invite_status AS ENUM ('pendente', 'aceito', 'expirado');

-- 2. Alter profiles table
ALTER TABLE public.profiles
  ADD COLUMN phone text,
  ADD COLUMN avatar_url text,
  ADD COLUMN status public.user_status NOT NULL DEFAULT 'ativo',
  ADD COLUMN last_access_at timestamptz,
  ADD COLUMN created_by uuid,
  ADD COLUMN permission_level public.permission_level NOT NULL DEFAULT 'basico',
  ADD COLUMN reliability_score float NOT NULL DEFAULT 0,
  ADD COLUMN availability jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN settings jsonb NOT NULL DEFAULT '{}';

-- 3. Permissions table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Role permissions table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- 5. User permissions (overrides)
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- 6. Invites table
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'colaborador',
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status public.invite_status NOT NULL DEFAULT 'pendente',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_company_created ON public.activity_logs(company_id, created_at DESC);
CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_email_status ON public.invites(email, status);
CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- 8. Security definer functions
CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND status = 'ativo'
  )
$$;

CREATE OR REPLACE FUNCTION public.check_user_permission(_user_id uuid, _permission_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _override boolean;
  _has_role_perm boolean;
BEGIN
  -- super_admin bypasses everything
  IF public.has_role(_user_id, 'super_admin') THEN
    RETURN true;
  END IF;

  -- check user-level override
  SELECT up.allowed INTO _override
  FROM public.user_permissions up
  JOIN public.permissions p ON p.id = up.permission_id
  WHERE up.user_id = _user_id AND p.name = _permission_name;

  IF _override IS NOT NULL THEN
    RETURN _override;
  END IF;

  -- fallback to role permissions
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.name = _permission_name
  ) INTO _has_role_perm;

  RETURN _has_role_perm;
END;
$$;

-- 9. Update handle_new_user trigger to consume invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _company_id uuid;
  _role public.app_role;
BEGIN
  -- Check for pending invite
  SELECT * INTO _invite
  FROM public.invites
  WHERE email = NEW.email
    AND status = 'pendente'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF _invite IS NOT NULL THEN
    _company_id := _invite.company_id;
    _role := _invite.role;

    UPDATE public.invites SET status = 'aceito' WHERE id = _invite.id;
  ELSE
    _company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;
    _role := 'colaborador';
  END IF;

  INSERT INTO public.profiles (id, company_id, name, email)
  VALUES (
    NEW.id,
    _company_id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

-- 10. RLS Policies for new tables

-- permissions: everyone can read, super_admin manages
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- role_permissions: everyone can read, super_admin manages
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admin manages role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- user_permissions: isolated by company
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own permissions" ON public.user_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin manages company user_permissions" ON public.user_permissions FOR ALL TO authenticated USING (
  (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
) WITH CHECK (
  (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- invites: admin of company or super_admin
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages company invites" ON public.invites FOR ALL TO authenticated USING (
  (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
) WITH CHECK (
  (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
-- Allow anonymous read of invite by token for signup flow
CREATE POLICY "Anyone can read invite by token" ON public.invites FOR SELECT TO anon USING (true);

-- activity_logs: admin reads company logs, super_admin all
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin views company logs" ON public.activity_logs FOR SELECT TO authenticated USING (
  (public.has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Authenticated users insert own logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "Super admin manages all logs" ON public.activity_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 11. Update existing RLS policies to check is_active_user

-- Companies policies: drop and recreate with active check
DROP POLICY IF EXISTS "Users view own company" ON public.companies;
CREATE POLICY "Users view own company" ON public.companies FOR SELECT TO authenticated USING (
  public.is_active_user(auth.uid()) AND (id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Admin updates own company" ON public.companies;
CREATE POLICY "Admin updates own company" ON public.companies FOR UPDATE TO authenticated USING (
  public.is_active_user(auth.uid()) AND id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
) WITH CHECK (
  public.is_active_user(auth.uid()) AND id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);

-- Profiles policies
DROP POLICY IF EXISTS "Users view company profiles" ON public.profiles;
CREATE POLICY "Users view company profiles" ON public.profiles FOR SELECT TO authenticated USING (
  public.is_active_user(auth.uid()) AND (company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (
  public.is_active_user(auth.uid()) AND id = auth.uid()
) WITH CHECK (
  public.is_active_user(auth.uid()) AND id = auth.uid()
);

-- user_roles policies
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (
  public.is_active_user(auth.uid()) AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
);

DROP POLICY IF EXISTS "Admin manages company roles" ON public.user_roles;
CREATE POLICY "Admin manages company roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (
  public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin') AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid())
);

DROP POLICY IF EXISTS "Admin updates company roles" ON public.user_roles;
CREATE POLICY "Admin updates company roles" ON public.user_roles FOR UPDATE TO authenticated USING (
  public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin') AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid())
);

DROP POLICY IF EXISTS "Admin deletes company roles" ON public.user_roles;
CREATE POLICY "Admin deletes company roles" ON public.user_roles FOR DELETE TO authenticated USING (
  public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin') AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid())
);
