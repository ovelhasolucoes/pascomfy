
-- Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- 1. ENUM types
-- ============================================
CREATE TYPE public.notification_type AS ENUM ('escala', 'evento', 'aviso', 'sistema');
CREATE TYPE public.notification_channel AS ENUM ('push', 'whatsapp', 'in_app');
CREATE TYPE public.notification_send_status AS ENUM ('enviado', 'erro');
CREATE TYPE public.whatsapp_provider AS ENUM ('meta', 'evo');

-- ============================================
-- 2. notifications
-- ============================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'sistema',
  read boolean NOT NULL DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_company_type ON public.notifications(company_id, type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "User updates own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin inserts company notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super admin manages all notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role inserts notifications" ON public.notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================
-- 3. notification_logs
-- ============================================
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  status public.notification_send_status NOT NULL DEFAULT 'enviado',
  gateway_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_logs_notif ON public.notification_logs(notification_id);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User views own notification logs" ON public.notification_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.id = notification_logs.notification_id AND n.user_id = auth.uid()
  ));

CREATE POLICY "Super admin manages all notification logs" ON public.notification_logs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role inserts notification logs" ON public.notification_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================
-- 4. user_notification_settings
-- ============================================
CREATE TABLE public.user_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own notification settings" ON public.user_notification_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin views company notification settings" ON public.user_notification_settings
  FOR SELECT TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super admin manages all notification settings" ON public.user_notification_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- 5. push_subscriptions
-- ============================================
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  keys jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin views all push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- 6. whatsapp_configs
-- ============================================
CREATE TABLE public.whatsapp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider public.whatsapp_provider NOT NULL DEFAULT 'meta',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_configs_company ON public.whatsapp_configs(company_id, active);

ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages company whatsapp configs" ON public.whatsapp_configs
  FOR ALL TO authenticated
  USING (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

-- ============================================
-- 7. notification_templates
-- ============================================
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message_template text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages company notification templates" ON public.notification_templates
  FOR ALL TO authenticated
  USING (
    (company_id IS NULL AND has_role(auth.uid(), 'super_admin'))
    OR (company_id IS NOT NULL AND has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (company_id IS NULL AND has_role(auth.uid(), 'super_admin'))
    OR (company_id IS NOT NULL AND has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Members view company templates" ON public.notification_templates
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR company_id = get_user_company_id(auth.uid())
  );

-- ============================================
-- 8. Trigger: notify on event_team_members insert
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_team_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _event record;
  _supabase_url text;
  _service_key text;
BEGIN
  -- Get event details
  SELECT e.title, e.id, e.company_id INTO _event
  FROM event_teams et
  JOIN events e ON e.id = et.event_id
  WHERE et.id = NEW.event_team_id;

  -- Insert notification directly (faster than HTTP for simple cases)
  INSERT INTO public.notifications (company_id, user_id, title, message, type, metadata)
  VALUES (
    NEW.company_id,
    NEW.user_id,
    'Nova escalação',
    'Você foi escalado para o evento: ' || COALESCE(_event.title, 'Evento'),
    'escala',
    jsonb_build_object('event_id', _event.id, 'event_team_id', NEW.event_team_id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_team_member_added
  AFTER INSERT ON public.event_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_team_member_added();

-- ============================================
-- 9. Trigger: notify on event status change
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (company_id, user_id, title, message, type, metadata)
    SELECT
      NEW.company_id,
      etm.user_id,
      'Evento atualizado',
      'O evento "' || NEW.title || '" foi alterado para: ' || NEW.status::text,
      'evento',
      jsonb_build_object('event_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    FROM event_teams et
    JOIN event_team_members etm ON etm.event_team_id = et.id
    WHERE et.event_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_updated
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_event_update();

-- ============================================
-- 10. Enable realtime for notifications
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
