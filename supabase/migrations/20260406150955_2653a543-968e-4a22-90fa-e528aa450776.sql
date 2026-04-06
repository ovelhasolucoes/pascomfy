
-- 1. New enums
CREATE TYPE public.subscription_status AS ENUM ('ativo', 'cancelado', 'trial', 'atrasado');
CREATE TYPE public.company_status AS ENUM ('ativa', 'suspensa', 'cancelada');
CREATE TYPE public.ticket_status AS ENUM ('aberto', 'respondido', 'fechado');
CREATE TYPE public.referral_status AS ENUM ('pendente', 'convertido');

-- 2. Expand plans
ALTER TABLE public.plans
  ADD COLUMN price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN max_uploads integer NOT NULL DEFAULT 100,
  ADD COLUMN allows_whitelabel boolean NOT NULL DEFAULT false,
  ADD COLUMN allows_custom_domain boolean NOT NULL DEFAULT false,
  ADD COLUMN description text;

-- 3. Create subscriptions table first (before companies FK)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  gateway text,
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan_id);

-- 4. Expand companies
ALTER TABLE public.companies
  ADD COLUMN status company_status NOT NULL DEFAULT 'ativa',
  ADD COLUMN storage_used_mb integer NOT NULL DEFAULT 0,
  ADD COLUMN active_users_count integer NOT NULL DEFAULT 0,
  ADD COLUMN trial_until timestamptz,
  ADD COLUMN custom_domain text,
  ADD COLUMN settings jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN subscription_id uuid REFERENCES public.subscriptions(id);

-- 5. Affiliate program
CREATE TABLE public.affiliate_program (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  commission_pct numeric(5,2) NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_program_company ON public.affiliate_program(company_id);

-- 6. Affiliate referrals
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliate_program(id) ON DELETE CASCADE,
  referred_company_id uuid NOT NULL REFERENCES public.companies(id),
  status referral_status NOT NULL DEFAULT 'pendente',
  reward_applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_referrals_affiliate ON public.affiliate_referrals(affiliate_id);

-- 7. Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status ticket_status NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_tickets_company ON public.support_tickets(company_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);

-- 8. Support messages
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_messages_ticket ON public.support_messages(ticket_id);

-- 9. Global logs
CREATE TABLE public.global_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_global_logs_user ON public.global_logs(user_id);
CREATE INDEX idx_global_logs_entity ON public.global_logs(entity, entity_id);
CREATE INDEX idx_global_logs_created ON public.global_logs(created_at DESC);

-- 10. RLS Policies

-- Plans: super_admin manages
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages plans" ON public.plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company views own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Affiliate program
ALTER TABLE public.affiliate_program ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company views own affiliate" ON public.affiliate_program FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages affiliates" ON public.affiliate_program FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Affiliate referrals
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company views own referrals" ON public.affiliate_referrals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.affiliate_program ap
    WHERE ap.id = affiliate_referrals.affiliate_id
      AND ap.company_id = get_user_company_id(auth.uid())
  ));
CREATE POLICY "Super admin manages referrals" ON public.affiliate_referrals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company manages own tickets" ON public.support_tickets FOR ALL TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()))
  WITH CHECK (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Super admin manages all tickets" ON public.support_tickets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Support messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ticket participants view messages" ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
      AND st.company_id = get_user_company_id(auth.uid())
  ) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users insert messages on own tickets" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_messages.ticket_id
      AND st.company_id = get_user_company_id(auth.uid())
  ) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages all messages" ON public.support_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Global logs
ALTER TABLE public.global_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages global logs" ON public.global_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- 11. get_company_limits function
CREATE OR REPLACE FUNCTION public.get_company_limits(_company_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'max_users', COALESCE(p.max_users, 10),
    'max_storage_mb', COALESCE(p.max_storage_mb, 500),
    'max_uploads', COALESCE(p.max_uploads, 100),
    'current_users', c.active_users_count,
    'current_storage', c.storage_used_mb
  )
  FROM public.companies c
  LEFT JOIN public.subscriptions s ON s.id = c.subscription_id
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE c.id = _company_id
$$;

-- 12. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets, support_messages;
