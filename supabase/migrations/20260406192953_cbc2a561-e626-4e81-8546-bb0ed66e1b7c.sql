
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invite RECORD;
  _company_id uuid;
  _role public.app_role;
  _company_name text;
  _referral_code text;
  _affiliate RECORD;
  _plan RECORD;
  _sub_id uuid;
  _trial_days integer;
BEGIN
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
    _company_name := NEW.raw_user_meta_data->>'company_name';
    _referral_code := NEW.raw_user_meta_data->>'referral_code';

    IF _company_id IS NULL AND _company_name IS NOT NULL AND _company_name != '' THEN
      _role := 'admin';

      -- Find cheapest plan for trial
      SELECT id, COALESCE(trial_days, 14) AS trial_days INTO _plan
      FROM public.plans ORDER BY price_monthly ASC LIMIT 1;

      _trial_days := COALESCE(_plan.trial_days, 14);
      _company_id := gen_random_uuid();

      -- Create company first
      INSERT INTO public.companies (id, name, status, trial_until)
      VALUES (_company_id, _company_name, 'ativa', now() + (_trial_days || ' days')::interval);

      -- Create subscription referencing existing company
      INSERT INTO public.subscriptions (plan_id, company_id, status, trial_until)
      VALUES (_plan.id, _company_id, 'trial', now() + (_trial_days || ' days')::interval)
      RETURNING id INTO _sub_id;

      -- Link subscription to company
      UPDATE public.companies SET subscription_id = _sub_id WHERE id = _company_id;

      -- Handle referral code
      IF _referral_code IS NOT NULL AND _referral_code != '' THEN
        SELECT * INTO _affiliate FROM public.affiliate_program
        WHERE code = _referral_code AND active = true;

        IF _affiliate IS NOT NULL AND _affiliate.company_id != _company_id THEN
          INSERT INTO public.affiliate_referrals (affiliate_id, referred_company_id, status)
          VALUES (_affiliate.id, _company_id, 'pendente');
        END IF;
      END IF;
    END IF;
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
$function$;
