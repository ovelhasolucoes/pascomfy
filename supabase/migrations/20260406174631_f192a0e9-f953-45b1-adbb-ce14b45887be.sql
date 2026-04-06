
-- Step 1: Create reward_type enum
CREATE TYPE public.reward_type AS ENUM ('dias_gratis', 'desconto', 'upgrade');

-- Step 2: Restructure affiliate_program
ALTER TABLE public.affiliate_program 
  DROP COLUMN commission_pct,
  ADD COLUMN reward_type public.reward_type NOT NULL DEFAULT 'dias_gratis',
  ADD COLUMN reward_value numeric NOT NULL DEFAULT 30;

-- Add unique constraint on code
ALTER TABLE public.affiliate_program ADD CONSTRAINT affiliate_program_code_unique UNIQUE (code);

-- Step 3: Add unique constraint on referred_company_id (each company can only be referred once)
ALTER TABLE public.affiliate_referrals ADD CONSTRAINT affiliate_referrals_referred_company_unique UNIQUE (referred_company_id);

-- Step 4: Create affiliate_rewards table
CREATE TABLE public.affiliate_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
  reward_type public.reward_type NOT NULL,
  reward_value numeric NOT NULL DEFAULT 0,
  applied boolean NOT NULL DEFAULT false,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 5: RLS for affiliate_rewards
ALTER TABLE public.affiliate_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admin views own rewards" ON public.affiliate_rewards
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND affiliate_company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Super admin manages rewards" ON public.affiliate_rewards
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Service role manages rewards" ON public.affiliate_rewards
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Add admin INSERT policy for affiliate_program (so admin can auto-create their program)
CREATE POLICY "Admin creates own affiliate program" ON public.affiliate_program
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())
  );

-- Step 7: Indexes
CREATE INDEX idx_affiliate_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX idx_affiliate_rewards_company_applied ON public.affiliate_rewards(affiliate_company_id, applied);

-- Step 8: Update handle_new_user to create company + referral on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
  _company_id uuid;
  _role public.app_role;
  _company_name text;
  _referral_code text;
  _affiliate RECORD;
  _plan RECORD;
  _sub_id uuid;
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
    _company_name := NEW.raw_user_meta_data->>'company_name';
    _referral_code := NEW.raw_user_meta_data->>'referral_code';

    -- If no company_id and company_name provided, create a new company (public signup)
    IF _company_id IS NULL AND _company_name IS NOT NULL AND _company_name != '' THEN
      _role := 'admin';

      -- Find cheapest plan for trial
      SELECT id INTO _plan FROM public.plans ORDER BY price_monthly ASC LIMIT 1;

      -- Create subscription trial
      INSERT INTO public.subscriptions (plan_id, company_id, status, trial_until)
      VALUES (_plan.id, gen_random_uuid(), 'trial', now() + interval '14 days')
      RETURNING id, company_id INTO _sub_id, _company_id;

      -- Update subscription with correct company_id
      UPDATE public.subscriptions SET company_id = _company_id WHERE id = _sub_id;

      -- Create company
      INSERT INTO public.companies (id, name, status, trial_until, subscription_id)
      VALUES (_company_id, _company_name, 'ativa', now() + interval '14 days', _sub_id);

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
$$;
