-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time timetz NOT NULL,
  end_time timetz NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address_label text NOT NULL,
  category text NOT NULL CHECK (category IN ('party', 'culture', 'sports')),
  organizer_name text NOT NULL,
  created_by_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Interests table
CREATE TABLE IF NOT EXISTS public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_interests_user ON public.interests(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_event ON public.interests(event_id);

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Events policies
DO $$ BEGIN
CREATE POLICY "events_select" ON public.events FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "events_insert" ON public.events FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "events_update" ON public.events FOR UPDATE TO authenticated
  USING (created_by_id = auth.uid() OR (auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK (created_by_id = auth.uid() OR (auth.jwt()->'app_metadata'->>'role') = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "events_delete" ON public.events FOR DELETE TO authenticated
  USING (created_by_id = auth.uid() OR (auth.jwt()->'app_metadata'->>'role') = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Interests policies
DO $$ BEGIN
CREATE POLICY "interests_select" ON public.interests FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "interests_insert" ON public.interests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "interests_delete" ON public.interests FOR DELETE TO authenticated
  USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Function to fetch events with interest counts + creator username
CREATE OR REPLACE FUNCTION public.get_events_with_details(target_date date)
RETURNS TABLE (
  id uuid, title text, description text, date date,
  start_time timetz, end_time timetz, lat double precision,
  lng double precision, address_label text, category text,
  organizer_name text, created_by_id uuid, created_at timestamptz,
  interested_count bigint, creator_username text
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.description, e.date, e.start_time, e.end_time,
    e.lat, e.lng, e.address_label, e.category, e.organizer_name,
    e.created_by_id, e.created_at,
    COALESCE(ic.cnt, 0)::bigint,
    u.raw_user_meta_data->>'user_name'
  FROM public.events e
  LEFT JOIN (SELECT event_id, COUNT(*) cnt FROM public.interests GROUP BY event_id) ic ON ic.event_id = e.id
  LEFT JOIN auth.users u ON u.id = e.created_by_id
  WHERE e.date = target_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_events_with_details(date) TO anon, authenticated;
