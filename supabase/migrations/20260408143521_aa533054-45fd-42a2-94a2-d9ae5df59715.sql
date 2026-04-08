
-- Fix: make view use SECURITY INVOKER (default safe behavior)
ALTER VIEW public.social_accounts_safe SET (security_invoker = on);
