
-- Enable pg_net extension for webhook triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Enums
CREATE TYPE public.automation_trigger_type AS ENUM (
  'usuario_escalado', 'evento_proximo', 'substituicao_solicitada',
  'substituicao_aprovada', 'presenca_pendente', 'evento_criado'
);

CREATE TYPE public.automation_channel AS ENUM ('whatsapp', 'push', 'email', 'in_app');

CREATE TYPE public.queue_status AS ENUM ('pendente', 'processando', 'enviado', 'erro');

-- Table: automations
CREATE TABLE public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'automatica',
  channel automation_channel NOT NULL DEFAULT 'in_app',
  trigger_event automation_trigger_type,
  active boolean NOT NULL DEFAULT true,
  title_template text NOT NULL,
  message_template text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages company automations" ON public.automations
  FOR ALL TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Members view company automations" ON public.automations
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND company_id = get_user_company_id(auth.uid()));

-- Table: automation_queue
CREATE TABLE public.automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  automation_id uuid REFERENCES public.automations(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel automation_channel NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  status queue_status NOT NULL DEFAULT 'pendente',
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_automation_queue_status ON public.automation_queue (status, created_at);

CREATE POLICY "Admin views company queue" ON public.automation_queue
  FOR SELECT TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin inserts company queue" ON public.automation_queue
  FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role manages queue" ON public.automation_queue
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Table: automation_logs
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  automation_id uuid REFERENCES public.automations(id) ON DELETE SET NULL,
  queue_item_id uuid REFERENCES public.automation_queue(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel automation_channel NOT NULL,
  status text NOT NULL DEFAULT 'enviado',
  message text NOT NULL,
  gateway_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_automation_logs_company ON public.automation_logs (company_id, created_at DESC);

CREATE POLICY "Admin views company logs" ON public.automation_logs
  FOR SELECT TO authenticated
  USING ((has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid())) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role manages logs" ON public.automation_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Trigger: process queue via pg_net webhook
CREATE OR REPLACE FUNCTION public.trigger_process_automation_queue()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _url text;
  _anon_key text;
BEGIN
  _url := current_setting('app.settings.supabase_url', true);
  IF _url IS NULL THEN
    _url := 'https://cchovdurprjtefisautg.supabase.co';
  END IF;

  _anon_key := current_setting('app.settings.supabase_anon_key', true);
  IF _anon_key IS NULL THEN
    _anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaG92ZHVycHJqdGVmaXNhdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODUyODYsImV4cCI6MjA5MTA2MTI4Nn0.bjXrVVNkUN88pq9piHFD7itpdjm2EcD5q7S7sFx0g8g';
  END IF;

  PERFORM extensions.http_post(
    url := _url || '/functions/v1/process-automation-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key
    ),
    body := jsonb_build_object('queue_item_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_process_automation_queue
  AFTER INSERT ON public.automation_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_process_automation_queue();

-- Trigger: enqueue automation on team member added
CREATE OR REPLACE FUNCTION public.enqueue_on_team_member_added()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _auto record;
  _event record;
  _user_name text;
  _team_name text;
  _msg text;
  _title text;
BEGIN
  SELECT e.title, e.start_date, e.id INTO _event
  FROM event_teams et JOIN events e ON e.id = et.event_id
  WHERE et.id = NEW.event_team_id;

  SELECT name INTO _user_name FROM profiles WHERE id = NEW.user_id;
  SELECT name INTO _team_name FROM event_teams WHERE id = NEW.event_team_id;

  FOR _auto IN
    SELECT * FROM automations
    WHERE company_id = NEW.company_id
      AND trigger_event = 'usuario_escalado'
      AND active = true
  LOOP
    _title := replace(replace(replace(_auto.title_template, '{{evento_nome}}', COALESCE(_event.title, '')), '{{usuario_nome}}', COALESCE(_user_name, '')), '{{equipe}}', COALESCE(_team_name, ''));
    _msg := replace(replace(replace(replace(replace(_auto.message_template, '{{evento_nome}}', COALESCE(_event.title, '')), '{{usuario_nome}}', COALESCE(_user_name, '')), '{{equipe}}', COALESCE(_team_name, '')), '{{data}}', COALESCE(to_char(_event.start_date, 'DD/MM/YYYY'), '')), '{{hora}}', COALESCE(to_char(_event.start_date, 'HH24:MI'), ''));
    _title := replace(_title, '{{funcao}}', COALESCE(NEW.role_name, ''));
    _msg := replace(_msg, '{{funcao}}', COALESCE(NEW.role_name, ''));

    INSERT INTO automation_queue (company_id, automation_id, user_id, channel, title, message, metadata)
    VALUES (NEW.company_id, _auto.id, NEW.user_id, _auto.channel, _title, _msg, jsonb_build_object('event_id', _event.id, 'trigger', 'usuario_escalado'));
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_on_team_member_added
  AFTER INSERT ON public.event_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_on_team_member_added();

-- Trigger: enqueue on event created
CREATE OR REPLACE FUNCTION public.enqueue_on_event_created()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _auto record;
  _admin record;
  _msg text;
  _title text;
BEGIN
  FOR _auto IN
    SELECT * FROM automations
    WHERE company_id = NEW.company_id
      AND trigger_event = 'evento_criado'
      AND active = true
  LOOP
    FOR _admin IN
      SELECT ur.user_id FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.role = 'admin' AND p.company_id = NEW.company_id AND p.status = 'ativo'
    LOOP
      _title := replace(_auto.title_template, '{{evento_nome}}', COALESCE(NEW.title, ''));
      _msg := replace(replace(replace(_auto.message_template, '{{evento_nome}}', COALESCE(NEW.title, '')), '{{data}}', COALESCE(to_char(NEW.start_date, 'DD/MM/YYYY'), '')), '{{hora}}', COALESCE(to_char(NEW.start_date, 'HH24:MI'), ''));

      INSERT INTO automation_queue (company_id, automation_id, user_id, channel, title, message, metadata)
      VALUES (NEW.company_id, _auto.id, _admin.user_id, _auto.channel, _title, _msg, jsonb_build_object('event_id', NEW.id, 'trigger', 'evento_criado'));
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_on_event_created();

-- Trigger: enqueue on substitution approved
CREATE OR REPLACE FUNCTION public.enqueue_on_substitution_approved()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _auto record;
  _event_title text;
  _user_name text;
  _msg text;
  _title text;
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    SELECT title INTO _event_title FROM events WHERE id = NEW.event_id;
    SELECT name INTO _user_name FROM profiles WHERE id = NEW.user_id;

    FOR _auto IN
      SELECT * FROM automations
      WHERE company_id = NEW.company_id
        AND trigger_event = 'substituicao_aprovada'
        AND active = true
    LOOP
      _title := replace(replace(_auto.title_template, '{{evento_nome}}', COALESCE(_event_title, '')), '{{usuario_nome}}', COALESCE(_user_name, ''));
      _msg := replace(replace(_auto.message_template, '{{evento_nome}}', COALESCE(_event_title, '')), '{{usuario_nome}}', COALESCE(_user_name, ''));

      INSERT INTO automation_queue (company_id, automation_id, user_id, channel, title, message, metadata)
      VALUES (NEW.company_id, _auto.id, NEW.user_id, _auto.channel, _title, _msg, jsonb_build_object('event_id', NEW.event_id, 'trigger', 'substituicao_aprovada'));
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_on_substitution_approved
  AFTER UPDATE ON public.event_substitutions
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_on_substitution_approved();
