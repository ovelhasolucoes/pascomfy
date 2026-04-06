
CREATE OR REPLACE FUNCTION public.notify_on_substitution_request()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _event_title text;
  _user_name text;
  _admin record;
BEGIN
  SELECT title INTO _event_title FROM public.events WHERE id = NEW.event_id;
  SELECT name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;

  FOR _admin IN
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin'
      AND p.company_id = NEW.company_id
      AND p.status = 'ativo'
  LOOP
    INSERT INTO public.notifications (company_id, user_id, title, message, type, metadata)
    VALUES (
      NEW.company_id,
      _admin.user_id,
      'Solicitação de substituição',
      COALESCE(_user_name, 'Colaborador') || ' solicitou substituição no evento "' || COALESCE(_event_title, 'Evento') || '". Motivo: ' || NEW.reason,
      'sistema',
      jsonb_build_object('event_id', NEW.event_id, 'substitution_id', NEW.id, 'user_id', NEW.user_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_substitution_request
  AFTER INSERT ON public.event_substitutions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_substitution_request();
