-- Add status column to events for cancel support
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));

-- Delete user account RPC (GDPR)
-- Deletes all user data: events, interests, follows, friendships, notifications, reports
-- Then deletes the auth.users row (requires SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's notifications
  DELETE FROM public.notifications WHERE user_id = auth.uid() OR data->>'actor_id' = auth.uid()::text;

  -- Delete user's interests
  DELETE FROM public.interests WHERE user_id = auth.uid();

  -- Delete user's follows (both directions)
  DELETE FROM public.follows WHERE follower_id = auth.uid() OR following_id = auth.uid();

  -- Delete user's friendships (both directions)
  DELETE FROM public.friendships WHERE user_id = auth.uid() OR friend_id = auth.uid();

  -- Delete user's reports
  DELETE FROM public.reports WHERE reporter_id = auth.uid();

  -- Delete user's events (and their related interests/reports via cascade or manual)
  DELETE FROM public.interests WHERE event_id IN (SELECT id FROM public.events WHERE created_by_id = auth.uid());
  DELETE FROM public.reports WHERE event_id IN (SELECT id FROM public.events WHERE created_by_id = auth.uid());
  DELETE FROM public.events WHERE created_by_id = auth.uid();

  -- Delete the auth user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
