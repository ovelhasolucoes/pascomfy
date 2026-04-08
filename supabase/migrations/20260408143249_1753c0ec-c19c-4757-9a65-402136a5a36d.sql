
-- Drop existing view and recreate with correct columns
DROP VIEW IF EXISTS public.social_accounts_safe;

CREATE VIEW public.social_accounts_safe AS
SELECT 
  id, company_id, provider, app_id, status, page_id, page_name,
  instagram_id, instagram_username, token_expires_at, created_at
FROM public.social_accounts;

-- Invite escalation prevention
CREATE OR REPLACE FUNCTION public.prevent_invite_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'super_admin' AND NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas super_admin pode convidar com role super_admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_invite_escalation
  BEFORE INSERT OR UPDATE ON public.invites
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_invite_escalation();
