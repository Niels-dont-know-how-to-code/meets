-- Security fixes for Meets app
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Rate limiting: max 10 events per user per day
CREATE OR REPLACE FUNCTION check_event_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.events
      WHERE created_by_id = NEW.created_by_id
      AND created_at > now() - interval '24 hours') >= 10 THEN
    RAISE EXCEPTION 'Event creation limit reached (max 10 per day)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_rate_limit ON public.events;
CREATE TRIGGER event_rate_limit
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION check_event_limit();

-- 2. Input length constraints
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS title_length;
ALTER TABLE public.events ADD CONSTRAINT title_length CHECK (char_length(title) <= 200);

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS desc_length;
ALTER TABLE public.events ADD CONSTRAINT desc_length CHECK (char_length(description) <= 2000);

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS org_length;
ALTER TABLE public.events ADD CONSTRAINT org_length CHECK (char_length(organizer_name) <= 100);

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS address_length;
ALTER TABLE public.events ADD CONSTRAINT address_length CHECK (char_length(address_label) <= 500);

-- 3. Interest rate limiting: max 50 interests per user per day
CREATE OR REPLACE FUNCTION check_interest_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.interests
      WHERE user_id = NEW.user_id
      AND created_at > now() - interval '24 hours') >= 50 THEN
    RAISE EXCEPTION 'Interest limit reached (max 50 per day)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interest_rate_limit ON public.interests;
CREATE TRIGGER interest_rate_limit
  BEFORE INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION check_interest_limit();

-- 4. Admin audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
