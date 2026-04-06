
-- 1. Make company_id nullable on profiles
ALTER TABLE public.profiles ALTER COLUMN company_id DROP NOT NULL;

-- 2. Update handle_new_user to allow null company_id
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
    _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'colaborador');
  END IF;

  INSERT INTO public.profiles (id, company_id, name, email)
  VALUES (
    NEW.id,
    _company_id,  -- can be NULL for super_admin
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;
