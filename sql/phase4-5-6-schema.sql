-- ============================================
-- MEETS Phase 4-6: Social, Notifications, Discovery
-- ============================================

-- ==================
-- PHASE 4: SOCIAL
-- ==================

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete" ON public.follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);

CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE TO authenticated
  USING (friend_id = auth.uid() AND status = 'pending');
CREATE POLICY "friendships_delete" ON public.friendships FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Organizer profile RPC
CREATE OR REPLACE FUNCTION public.get_organizer_profile(organizer_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'display_name', COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)),
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

GRANT EXECUTE ON FUNCTION public.get_organizer_profile(uuid) TO anon, authenticated;

-- Friends interests RPC
CREATE OR REPLACE FUNCTION public.get_friends_interests(target_date date)
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

GRANT EXECUTE ON FUNCTION public.get_friends_interests(date) TO authenticated;

-- Search user by email RPC
CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'display_name', COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)),
    'avatar_url', u.raw_user_meta_data->>'avatar_url'
  ) INTO result
  FROM auth.users u
  WHERE u.email = search_email;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_user_by_email(text) TO authenticated;

-- ==================
-- PHASE 5: NOTIFICATIONS
-- ==================

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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Trigger: notify event owner when someone shows interest
CREATE OR REPLACE FUNCTION public.trg_notify_interest()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP TRIGGER IF EXISTS trg_notify_interest ON public.interests;
CREATE TRIGGER trg_notify_interest AFTER INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_interest();

-- Trigger: notify when someone follows you
CREATE OR REPLACE FUNCTION public.trg_notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_follow();

-- Trigger: notify on friend request / acceptance
CREATE OR REPLACE FUNCTION public.trg_notify_friend()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

DROP TRIGGER IF EXISTS trg_notify_friend ON public.friendships;
CREATE TRIGGER trg_notify_friend AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_friend();

-- ==================
-- PHASE 6: DISCOVERY
-- ==================

-- Drop and recreate get_events_with_details with new params
DROP FUNCTION IF EXISTS public.get_events_with_details(date);

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
  report_count bigint, distance_km float8, is_verified boolean
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
    COALESCE((u.raw_app_meta_data->>'verified')::boolean, false) AS is_verified
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
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_events_with_details(date, date, float8, float8, float8) TO anon, authenticated;

-- Trending events RPC
CREATE OR REPLACE FUNCTION public.get_trending_events(
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

GRANT EXECUTE ON FUNCTION public.get_trending_events(date, date, int) TO anon, authenticated;
