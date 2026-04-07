-- Add checkin_token to events (for event QR codes)
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS checkin_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS checkin_window_minutes integer DEFAULT 60;

-- Add checkin_code to profiles (for volunteer personal QR)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkin_code uuid DEFAULT gen_random_uuid();

-- Update existing rows that have null values
UPDATE public.events SET checkin_token = gen_random_uuid() WHERE checkin_token IS NULL;
UPDATE public.profiles SET checkin_code = gen_random_uuid() WHERE checkin_code IS NULL;