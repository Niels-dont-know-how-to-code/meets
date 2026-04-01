# Pending SQL Migrations

These SQL changes need to be applied manually in the **Supabase SQL Editor**
(Dashboard > SQL Editor > New Query).

Run them in order. Once applied, check off each item.

---

## 1. Fix interests privacy leak (schema change)

The `interests_select` policy currently lets anyone see all user interests.
Change it so users can only see their own.

```sql
-- Drop the old policy first
DROP POLICY IF EXISTS "interests_select" ON public.interests;

-- Recreate: users can only see their own interests
CREATE POLICY "interests_select" ON public.interests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

**Why:** Previously any user (even anonymous) could query all interests and see
which users liked which events. Interest *counts* are still public via the
`get_events_with_details` RPC function, so no functionality is lost.

---

## 2. Fix audit log RLS (security-fixes.sql)

The audit log INSERT policy currently allows any authenticated user to write
fake audit entries. Restrict it to admins only.

```sql
-- Drop the old policy
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;

-- Recreate: only admins can insert
CREATE POLICY "Admins can insert audit log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND (auth.jwt()->'app_metadata'->>'role') = 'admin'
  );
```

**Why:** Any authenticated user could insert fake audit log entries with
arbitrary admin_id values, polluting the audit trail.

---

## 3. Lower event rate limit from 10 to 5 per day

```sql
CREATE OR REPLACE FUNCTION check_event_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.events
      WHERE created_by_id = NEW.created_by_id
      AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Event creation limit reached (max 5 per day)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Why:** 10 spam events per day per account is too many. 5 is enough for
legitimate use while reducing abuse potential.

---

---

## 4. Add image_url column to events table

```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url text;
```

**Why:** Supports the new event images feature. Stores the public URL of the
uploaded image from Supabase Storage.

---

## 5. Create event-images storage bucket

Run this in the SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow public read
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-images');

-- Allow owners to delete their images
CREATE POLICY "Users can delete own event images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-images' AND (storage.foldername(name))[2] IN (
  SELECT id::text FROM public.events WHERE created_by_id = auth.uid()
));
```

**Why:** Creates a public storage bucket for event images with appropriate
access controls.

---

## 6. Create reports table and RLS policies

```sql
-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can see their own reports
CREATE POLICY "Users can see own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can report events (once per event)
CREATE POLICY "Users can report events" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can see all reports
CREATE POLICY "Admins can see all reports" ON public.reports
  FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Admins can delete reports
CREATE POLICY "Admins can delete reports" ON public.reports
  FOR DELETE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');
```

**Why:** Enables the report/flag system. Users can report events once.
Events with 3+ reports are auto-hidden from the feed.

---

## 7. Update get_events_with_details RPC to include report count

```sql
CREATE OR REPLACE FUNCTION get_events_with_details(target_date date)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  date date,
  start_time timetz,
  end_time timetz,
  lat double precision,
  lng double precision,
  address_label text,
  category text,
  organizer_name text,
  created_by_id uuid,
  created_at timestamptz,
  image_url text,
  interested_count bigint,
  report_count bigint,
  creator_username text
) AS $$
  SELECT
    e.id, e.title, e.description, e.date, e.start_time, e.end_time,
    e.lat, e.lng, e.address_label, e.category, e.organizer_name,
    e.created_by_id, e.created_at, e.image_url,
    COALESCE(i.cnt, 0) AS interested_count,
    COALESCE(r.cnt, 0) AS report_count,
    COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)) AS creator_username
  FROM public.events e
  LEFT JOIN (SELECT event_id, COUNT(*) AS cnt FROM public.interests GROUP BY event_id) i ON i.event_id = e.id
  LEFT JOIN (SELECT event_id, COUNT(*) AS cnt FROM public.reports GROUP BY event_id) r ON r.event_id = e.id
  LEFT JOIN auth.users u ON u.id = e.created_by_id
  WHERE e.date = target_date
    AND COALESCE(r.cnt, 0) < 3
  ORDER BY e.start_time;
$$ LANGUAGE sql SECURITY DEFINER;
```

**Why:** Adds report_count to the RPC results and automatically hides events
with 3+ reports from the query results.

---

## Verification

After running all 7 migrations, verify with:

```sql
-- Check interests policy
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'interests';

-- Check audit_log policy
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'audit_log';

-- Check event limit function
SELECT prosrc FROM pg_proc WHERE proname = 'check_event_limit';

-- Check image_url column
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'image_url';

-- Check storage bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'event-images';

-- Check reports table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'reports' ORDER BY ordinal_position;

-- Check reports policies
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'reports';
```
