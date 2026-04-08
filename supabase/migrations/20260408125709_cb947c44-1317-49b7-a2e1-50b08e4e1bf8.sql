-- Function to get company limits
CREATE OR REPLACE FUNCTION public.enforce_plan_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limits jsonb;
  _current_count integer;
  _max_users integer;
BEGIN
  -- Skip for super_admin operations
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  _limits := get_company_limits(NEW.company_id);
  _max_users := COALESCE((_limits->>'max_users')::integer, 10);
  
  SELECT COUNT(*) INTO _current_count
  FROM profiles WHERE company_id = NEW.company_id AND status = 'ativo';
  
  IF _current_count >= _max_users THEN
    RAISE EXCEPTION 'Limite de usuários do plano atingido (% de %)', _current_count, _max_users;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to enforce file upload limits
CREATE OR REPLACE FUNCTION public.enforce_plan_upload_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limits jsonb;
  _current_uploads integer;
  _max_uploads integer;
  _current_storage numeric;
  _max_storage integer;
BEGIN
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  _limits := get_company_limits(NEW.company_id);
  _max_uploads := COALESCE((_limits->>'max_uploads')::integer, 100);
  _max_storage := COALESCE((_limits->>'max_storage_mb')::integer, 500);

  SELECT COUNT(*) INTO _current_uploads FROM files WHERE company_id = NEW.company_id;
  IF _current_uploads >= _max_uploads THEN
    RAISE EXCEPTION 'Limite de uploads do plano atingido (% de %)', _current_uploads, _max_uploads;
  END IF;

  SELECT COALESCE(SUM(size_bytes), 0) / (1024.0 * 1024.0) INTO _current_storage FROM files WHERE company_id = NEW.company_id;
  IF _current_storage + (NEW.size_bytes / (1024.0 * 1024.0)) > _max_storage THEN
    RAISE EXCEPTION 'Limite de storage do plano atingido (%.1f MB de % MB)', _current_storage, _max_storage;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to check company is not blocked
CREATE OR REPLACE FUNCTION public.enforce_company_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status text;
  _block_mode text;
BEGIN
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT status::text, block_mode INTO _status, _block_mode
  FROM companies WHERE id = NEW.company_id;

  IF _status = 'suspensa' OR _status = 'bloqueada' THEN
    IF _block_mode = 'hard' THEN
      RAISE EXCEPTION 'Empresa bloqueada. Contate o suporte.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER trg_enforce_user_limit
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_plan_user_limit();

CREATE TRIGGER trg_enforce_upload_limit
  BEFORE INSERT ON public.files
  FOR EACH ROW EXECUTE FUNCTION enforce_plan_upload_limit();

CREATE TRIGGER trg_enforce_company_active_events
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION enforce_company_active();

CREATE TRIGGER trg_enforce_company_active_files
  BEFORE INSERT ON public.files
  FOR EACH ROW EXECUTE FUNCTION enforce_company_active();