-- Meets full Supabase setup
-- Idempotent bootstrap for a resumed or fresh Supabase project.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================
-- Tables
-- ==================

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
  category text NOT NULL,
  organizer_name text NOT NULL,
  created_by_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  image_url text,
  visibility text NOT NULL DEFAULT 'public',
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;
ALTER TABLE public.events ADD CONSTRAINT events_category_check CHECK (category IN ('party', 'culture', 'sports'));
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_visibility_check;
ALTER TABLE public.events ADD CONSTRAINT events_visibility_check CHECK (visibility IN ('public', 'friends'));
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (status IN ('active', 'cancelled'));
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS title_length;
ALTER TABLE public.events ADD CONSTRAINT title_length CHECK (char_length(title) <= 200);
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS desc_length;
ALTER TABLE public.events ADD CONSTRAINT desc_length CHECK (description IS NULL OR char_length(description) <= 2000);
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS org_length;
ALTER TABLE public.events ADD CONSTRAINT org_length CHECK (char_length(organizer_name) <= 100);
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS address_length;
ALTER TABLE public.events ADD CONSTRAINT address_length CHECK (char_length(address_label) <= 500);

CREATE TABLE IF NOT EXISTS public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) <= 500),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('interest', 'follow', 'friend_request', 'friend_accepted', 'new_event')),
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_interests_user ON public.interests(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_event ON public.interests(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_event ON public.reports(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ==================
-- RLS
-- ==================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select ON public.events;
CREATE POLICY events_select ON public.events FOR SELECT
  USING (
    visibility = 'public'
    OR created_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.user_id = auth.uid() AND f.friend_id = events.created_by_id)
          OR (f.friend_id = auth.uid() AND f.user_id = events.created_by_id)
        )
    )
  );

DROP POLICY IF EXISTS events_insert ON public.events;
CREATE POLICY events_insert ON public.events FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid());

DROP POLICY IF EXISTS events_update ON public.events;
CREATE POLICY events_update ON public.events FOR UPDATE TO authenticated
  USING (created_by_id = auth.uid() OR (auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK (created_by_id = auth.uid() OR (auth.jwt()->'app_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS events_delete ON public.events;
CREATE POLICY events_delete ON public.events FOR DELETE TO authenticated
  USING (created_by_id = auth.uid() OR (auth.jwt()->'app_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS interests_select ON public.interests;
CREATE POLICY interests_select ON public.interests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = interests.event_id
        AND e.created_by_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS interests_insert ON public.interests;
CREATE POLICY interests_insert ON public.interests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS interests_delete ON public.interests;
CREATE POLICY interests_delete ON public.interests FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS reports_insert ON public.reports;
CREATE POLICY reports_insert ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS reports_select_admin ON public.reports;
CREATE POLICY reports_select_admin ON public.reports FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS reports_delete_admin ON public.reports;
CREATE POLICY reports_delete_admin ON public.reports FOR DELETE TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

DROP POLICY IF EXISTS follows_select ON public.follows;
CREATE POLICY follows_select ON public.follows FOR SELECT TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid());

DROP POLICY IF EXISTS follows_insert ON public.follows;
CREATE POLICY follows_insert ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS follows_delete ON public.follows;
CREATE POLICY follows_delete ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

DROP POLICY IF EXISTS friendships_select ON public.friendships;
CREATE POLICY friendships_select ON public.friendships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

DROP POLICY IF EXISTS friendships_insert ON public.friendships;
CREATE POLICY friendships_insert ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS friendships_update ON public.friendships;
CREATE POLICY friendships_update ON public.friendships FOR UPDATE TO authenticated
  USING (friend_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS friendships_delete ON public.friendships;
CREATE POLICY friendships_delete ON public.friendships FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS audit_log_select_admin ON public.audit_log;
CREATE POLICY audit_log_select_admin ON public.audit_log FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- ==================
-- Functions
-- ==================

CREATE OR REPLACE FUNCTION public.check_username_available(desired_username text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(raw_user_meta_data->>'username') = lower(desired_username)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_event_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF (SELECT COUNT(*) FROM public.events
      WHERE created_by_id = NEW.created_by_id
        AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'Event creation limit reached (max 5 per day)';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_interest_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.interests
      WHERE user_id = NEW.user_id
        AND created_at > now() - interval '24 hours') >= 50 THEN
    RAISE EXCEPTION 'Interest limit reached (max 50 per day)';
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.search_organisers(text);
CREATE FUNCTION public.search_organisers(search_term text)
RETURNS TABLE (id uuid, display_name text, avatar_url text, follower_count bigint, is_verified boolean, username text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)) AS display_name,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url,
    COALESCE(fc.cnt, 0)::bigint AS follower_count,
    COALESCE((u.raw_app_meta_data->>'verified')::boolean, false) AS is_verified,
    u.raw_user_meta_data->>'username' AS username
  FROM auth.users u
  LEFT JOIN (SELECT following_id, COUNT(*) cnt FROM public.follows GROUP BY following_id) fc ON fc.following_id = u.id
  WHERE COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1))
      ILIKE '%' || search_term || '%'
    OR u.raw_user_meta_data->>'username' ILIKE '%' || search_term || '%'
  ORDER BY follower_count DESC
  LIMIT 10;
$$;

DROP FUNCTION IF EXISTS public.search_user_by_email(text);
CREATE FUNCTION public.search_user_by_email(search_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'display_name', COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)),
    'avatar_url', u.raw_user_meta_data->>'avatar_url',
    'username', u.raw_user_meta_data->>'username'
  ) INTO result
  FROM auth.users u
  WHERE u.email = search_email
     OR lower(u.raw_user_meta_data->>'username') = lower(search_email);

  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_organizer_profile(uuid);
CREATE FUNCTION public.get_organizer_profile(organizer_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'display_name', COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)),
    'username', u.raw_user_meta_data->>'username',
    'avatar_url', u.raw_user_meta_data->>'avatar_url',
    'member_since', u.created_at,
    'is_verified', COALESCE((u.raw_app_meta_data->>'verified')::boolean, false),
    'total_events', (SELECT COUNT(*) FROM public.events WHERE created_by_id = organizer_id),
    'total_interests', (SELECT COUNT(*) FROM public.interests i JOIN public.events e ON i.event_id = e.id WHERE e.created_by_id = organizer_id),
    'follower_count', (SELECT COUNT(*) FROM public.follows WHERE following_id = organizer_id),
    'events', COALESCE((
      SELECT json_agg(json_build_object(
        'id', e.id, 'title', e.title, 'date', e.date, 'category', e.category,
        'interested_count', COALESCE(ic.cnt, 0)
      ) ORDER BY e.date DESC)
      FROM public.events e
      LEFT JOIN (SELECT event_id, COUNT(*) cnt FROM public.interests GROUP BY event_id) ic ON ic.event_id = e.id
      WHERE e.created_by_id = organizer_id
      LIMIT 20
    ), '[]'::json)
  ) INTO result
  FROM auth.users u
  WHERE u.id = organizer_id;

  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_friends_interests(date);
CREATE FUNCTION public.get_friends_interests(target_date date)
RETURNS TABLE (event_id uuid, friend_id uuid, friend_name text, friend_avatar text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT i.event_id,
    CASE WHEN f.user_id = auth.uid() THEN f.friend_id ELSE f.user_id END AS friend_id,
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)) AS friend_name,
    u.raw_user_meta_data->>'avatar_url' AS friend_avatar
  FROM public.friendships f
  JOIN auth.users u ON u.id = CASE WHEN f.user_id = auth.uid() THEN f.friend_id ELSE f.user_id END
  JOIN public.interests i ON i.user_id = u.id
  JOIN public.events e ON e.id = i.event_id AND e.date = target_date
  WHERE f.status = 'accepted'
    AND (f.user_id = auth.uid() OR f.friend_id = auth.uid());
$$;

DROP FUNCTION IF EXISTS public.get_events_with_details(date);
DROP FUNCTION IF EXISTS public.get_events_with_details(date, date, float8, float8, float8);
CREATE FUNCTION public.get_events_with_details(
  target_date date,
  end_date date DEFAULT NULL,
  user_lat float8 DEFAULT NULL,
  user_lng float8 DEFAULT NULL,
  radius_km float8 DEFAULT NULL
)
RETURNS TABLE (
  id uuid, title text, description text, date date,
  start_time timetz, end_time timetz, lat double precision,
  lng double precision, address_label text, category text,
  organizer_name text, created_by_id uuid, created_at timestamptz,
  interested_count bigint, creator_username text, image_url text,
  report_count bigint, distance_km float8, is_verified boolean,
  visibility text, creator_handle text, status text
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.description, e.date, e.start_time, e.end_time,
    e.lat, e.lng, e.address_label, e.category, e.organizer_name,
    e.created_by_id, e.created_at,
    COALESCE(ic.cnt, 0)::bigint AS interested_count,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'user_name',
      split_part(u.email, '@', 1)
    ) AS creator_username,
    e.image_url,
    COALESCE(rc.cnt, 0)::bigint AS report_count,
    CASE WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(e.lat)) * cos(radians(e.lng) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(e.lat))
        ))
      )
    ELSE NULL END AS distance_km,
    COALESCE((u.raw_app_meta_data->>'verified')::boolean, false) AS is_verified,
    e.visibility,
    u.raw_user_meta_data->>'username' AS creator_handle,
    e.status
  FROM public.events e
  LEFT JOIN (SELECT event_id, COUNT(*) cnt FROM public.interests GROUP BY event_id) ic ON ic.event_id = e.id
  LEFT JOIN (SELECT event_id, COUNT(*) cnt FROM public.reports GROUP BY event_id) rc ON rc.event_id = e.id
  LEFT JOIN auth.users u ON u.id = e.created_by_id
  WHERE e.date BETWEEN target_date AND COALESCE(end_date, target_date)
    AND COALESCE(rc.cnt, 0) < 3
    AND (radius_km IS NULL OR user_lat IS NULL OR user_lng IS NULL OR
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(e.lat)) * cos(radians(e.lng) - radians(user_lng))
          + sin(radians(user_lat)) * sin(radians(e.lat))
        ))
      ) <= radius_km
    )
    AND (
      e.visibility = 'public'
      OR e.created_by_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.user_id = auth.uid() AND f.friend_id = e.created_by_id)
            OR (f.friend_id = auth.uid() AND f.user_id = e.created_by_id)
          )
      )
    );
$$;

DROP FUNCTION IF EXISTS public.get_trending_events(date, date, int);
CREATE FUNCTION public.get_trending_events(
  from_date date,
  to_date date DEFAULT NULL,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  id uuid, title text, date date, category text,
  interested_count bigint, lat double precision, lng double precision
) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.title, e.date, e.category,
    COALESCE(ic.cnt, 0)::bigint AS interested_count,
    e.lat, e.lng
  FROM public.events e
  LEFT JOIN (SELECT event_id, COUNT(*) cnt FROM public.interests GROUP BY event_id) ic ON ic.event_id = e.id
  LEFT JOIN (SELECT event_id, COUNT(*) cnt FROM public.reports GROUP BY event_id) rc ON rc.event_id = e.id
  WHERE e.date BETWEEN from_date AND COALESCE(to_date, from_date)
    AND COALESCE(rc.cnt, 0) < 3
    AND COALESCE(ic.cnt, 0) >= 2
  ORDER BY COALESCE(ic.cnt, 0) DESC
  LIMIT max_results;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_interest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  event_owner uuid;
  event_title text;
  actor_name text;
BEGIN
  SELECT created_by_id, title INTO event_owner, event_title FROM public.events WHERE id = NEW.event_id;
  IF event_owner IS NULL OR event_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'user_name', split_part(email, '@', 1))
    INTO actor_name FROM auth.users WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (event_owner, 'interest', actor_name || ' is interested', 'in your event "' || event_title || '"',
    json_build_object('event_id', NEW.event_id, 'actor_id', NEW.user_id)::jsonb);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
BEGIN
  SELECT COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'user_name', split_part(email, '@', 1))
    INTO actor_name FROM auth.users WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (NEW.following_id, 'follow', actor_name || ' followed you', NULL,
    json_build_object('actor_id', NEW.follower_id)::jsonb);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_notify_friend()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'user_name', split_part(email, '@', 1))
      INTO actor_name FROM auth.users WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.friend_id, 'friend_request', actor_name || ' sent you a friend request', NULL,
      json_build_object('friendship_id', NEW.id, 'actor_id', NEW.user_id)::jsonb);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'user_name', split_part(email, '@', 1))
      INTO actor_name FROM auth.users WHERE id = NEW.friend_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.user_id, 'friend_accepted', actor_name || ' accepted your friend request', NULL,
      json_build_object('friendship_id', NEW.id, 'actor_id', NEW.friend_id)::jsonb);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.notifications WHERE user_id = auth.uid() OR data->>'actor_id' = auth.uid()::text;
  DELETE FROM public.interests WHERE user_id = auth.uid();
  DELETE FROM public.follows WHERE follower_id = auth.uid() OR following_id = auth.uid();
  DELETE FROM public.friendships WHERE user_id = auth.uid() OR friend_id = auth.uid();
  DELETE FROM public.reports WHERE reporter_id = auth.uid();
  DELETE FROM public.interests WHERE event_id IN (SELECT id FROM public.events WHERE created_by_id = auth.uid());
  DELETE FROM public.reports WHERE event_id IN (SELECT id FROM public.events WHERE created_by_id = auth.uid());
  DELETE FROM public.events WHERE created_by_id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- ==================
-- Triggers and grants
-- ==================

DROP TRIGGER IF EXISTS event_rate_limit ON public.events;
CREATE TRIGGER event_rate_limit BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.check_event_limit();

DROP TRIGGER IF EXISTS interest_rate_limit ON public.interests;
CREATE TRIGGER interest_rate_limit BEFORE INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public.check_interest_limit();

DROP TRIGGER IF EXISTS trg_notify_interest ON public.interests;
CREATE TRIGGER trg_notify_interest AFTER INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_interest();

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_follow();

DROP TRIGGER IF EXISTS trg_notify_friend ON public.friendships;
CREATE TRIGGER trg_notify_friend AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_friend();

GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_organisers(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organizer_profile(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends_interests(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_events_with_details(date, date, float8, float8, float8) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_events(date, date, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ==================
-- Storage buckets
-- ==================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('event-images', 'event-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_owner_upload ON storage.objects;
CREATE POLICY avatars_owner_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS avatars_owner_update ON storage.objects;
CREATE POLICY avatars_owner_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS event_images_public_read ON storage.objects;
CREATE POLICY event_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS event_images_auth_upload ON storage.objects;
CREATE POLICY event_images_auth_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS event_images_owner_delete ON storage.objects;
CREATE POLICY event_images_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
