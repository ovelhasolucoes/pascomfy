
-- Enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pago', 'pendente', 'falhou', 'estornado');

-- Payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'pendente',
  gateway text,
  external_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages payments"
  ON public.payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admin views own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Service role manages payments"
  ON public.payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Expand subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_until timestamptz,
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

-- Expand companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS block_mode text NOT NULL DEFAULT 'soft';
