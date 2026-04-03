-- Add username support
-- Usernames are stored in raw_user_meta_data.username

-- Check if a username is available (case-insensitive)
CREATE OR REPLACE FUNCTION public.check_username_available(desired_username text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(raw_user_meta_data->>'username') = lower(desired_username)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;

-- Update search_organisers to also match by username
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

GRANT EXECUTE ON FUNCTION public.search_organisers(text) TO anon, authenticated;

-- Update search_user_by_email to also search by username
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

GRANT EXECUTE ON FUNCTION public.search_user_by_email(text) TO authenticated;

-- Update get_organizer_profile to include username
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
    'is_organiser', COALESCE((u.raw_app_meta_data->>'is_organiser')::boolean, false),
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

-- Update get_events_with_details to include creator username handle
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
  visibility text, is_organiser boolean, creator_handle text
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
    COALESCE((u.raw_app_meta_data->>'is_organiser')::boolean, false) AS is_organiser,
    u.raw_user_meta_data->>'username' AS creator_handle
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

GRANT EXECUTE ON FUNCTION public.get_events_with_details(date, date, float8, float8, float8) TO anon, authenticated;
