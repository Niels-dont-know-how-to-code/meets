-- Remove organiser-only filter from search - anyone can be searched and followed
DROP FUNCTION IF EXISTS public.search_organisers(text);

CREATE FUNCTION public.search_organisers(search_term text)
RETURNS TABLE (id uuid, display_name text, avatar_url text, follower_count bigint, is_verified boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1)) AS display_name,
    u.raw_user_meta_data->>'avatar_url' AS avatar_url,
    COALESCE(fc.cnt, 0)::bigint AS follower_count,
    COALESCE((u.raw_app_meta_data->>'verified')::boolean, false) AS is_verified
  FROM auth.users u
  LEFT JOIN (SELECT following_id, COUNT(*) cnt FROM public.follows GROUP BY following_id) fc ON fc.following_id = u.id
  WHERE COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'user_name', split_part(u.email, '@', 1))
      ILIKE '%' || search_term || '%'
  ORDER BY follower_count DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.search_organisers(text) TO anon, authenticated;
