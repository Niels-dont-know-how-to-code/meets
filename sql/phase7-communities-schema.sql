-- ============================================
-- MEETS Phase 7: Communities (WhatsApp-style)
-- ============================================

-- ==================
-- NOTIFICATION TYPES UPDATE
-- ==================

-- Add new notification types for communities
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('interest', 'follow', 'friend_request', 'friend_accepted', 'new_event', 'community_join_request', 'community_approved'));

-- ==================
-- TABLES
-- ==================

-- Communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) <= 100),
  description text CHECK (length(description) <= 500),
  image_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON public.communities(created_by);

CREATE POLICY "communities_select" ON public.communities FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "communities_insert" ON public.communities FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "communities_update" ON public.communities FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "communities_delete" ON public.communities FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Community members table
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);

-- Community subgroups table
CREATE TABLE IF NOT EXISTS public.community_subgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) <= 100),
  description text CHECK (length(description) <= 300),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.community_subgroups ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_community_subgroups_community ON public.community_subgroups(community_id);

-- Subgroup members table
CREATE TABLE IF NOT EXISTS public.subgroup_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subgroup_id uuid NOT NULL REFERENCES public.community_subgroups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(subgroup_id, user_id)
);

ALTER TABLE public.subgroup_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_subgroup_members_subgroup ON public.subgroup_members(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_subgroup_members_user ON public.subgroup_members(user_id);

-- Community join requests table
CREATE TABLE IF NOT EXISTS public.community_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text CHECK (length(message) <= 300),
  created_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);

ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_community_join_requests_community ON public.community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_user ON public.community_join_requests(user_id);

-- Community messages table
CREATE TABLE IF NOT EXISTS public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  subgroup_id uuid REFERENCES public.community_subgroups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) <= 2000),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_community_messages_pagination ON public.community_messages(community_id, subgroup_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_sender ON public.community_messages(sender_id);

-- ==================
-- HELPER FUNCTIONS
-- ==================

CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_subgroup_member(p_subgroup_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subgroup_members
    WHERE subgroup_id = p_subgroup_id AND user_id = auth.uid()
  );
$$;

-- ==================
-- RLS POLICIES (using helper functions)
-- ==================

-- Community members: SELECT where user is a member of the same community
CREATE POLICY "community_members_select" ON public.community_members FOR SELECT TO authenticated
  USING (public.is_community_member(community_id));
-- Community members: Admin INSERT/UPDATE/DELETE for their community
CREATE POLICY "community_members_insert" ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (public.is_community_admin(community_id));
CREATE POLICY "community_members_update" ON public.community_members FOR UPDATE TO authenticated
  USING (public.is_community_admin(community_id));
-- Community members: Admin DELETE or self DELETE (leave)
CREATE POLICY "community_members_delete" ON public.community_members FOR DELETE TO authenticated
  USING (public.is_community_admin(community_id) OR user_id = auth.uid());

-- Community join requests: Auth INSERT own
CREATE POLICY "community_join_requests_insert" ON public.community_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
-- Community join requests: Admin SELECT for their community
CREATE POLICY "community_join_requests_select" ON public.community_join_requests FOR SELECT TO authenticated
  USING (public.is_community_admin(community_id));
-- Community join requests: User DELETE own
CREATE POLICY "community_join_requests_delete" ON public.community_join_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Community subgroups: SELECT for community members
CREATE POLICY "community_subgroups_select" ON public.community_subgroups FOR SELECT TO authenticated
  USING (public.is_community_member(community_id));
-- Community subgroups: Admin INSERT/UPDATE/DELETE
CREATE POLICY "community_subgroups_insert" ON public.community_subgroups FOR INSERT TO authenticated
  WITH CHECK (public.is_community_admin(community_id));
CREATE POLICY "community_subgroups_update" ON public.community_subgroups FOR UPDATE TO authenticated
  USING (public.is_community_admin(community_id));
CREATE POLICY "community_subgroups_delete" ON public.community_subgroups FOR DELETE TO authenticated
  USING (public.is_community_admin(community_id));

-- Subgroup members: SELECT for subgroup members
CREATE POLICY "subgroup_members_select" ON public.subgroup_members FOR SELECT TO authenticated
  USING (public.is_subgroup_member(subgroup_id));
-- Subgroup members: Admin INSERT/DELETE (admin of parent community)
CREATE POLICY "subgroup_members_insert" ON public.subgroup_members FOR INSERT TO authenticated
  WITH CHECK (public.is_community_admin((SELECT community_id FROM public.community_subgroups WHERE id = subgroup_id)));
CREATE POLICY "subgroup_members_delete" ON public.subgroup_members FOR DELETE TO authenticated
  USING (public.is_community_admin((SELECT community_id FROM public.community_subgroups WHERE id = subgroup_id)));

-- Community messages: SELECT where user is member of community AND (subgroup_id IS NULL OR user is member of that subgroup)
CREATE POLICY "community_messages_select" ON public.community_messages FOR SELECT TO authenticated
  USING (
    public.is_community_member(community_id)
    AND (subgroup_id IS NULL OR public.is_subgroup_member(subgroup_id))
  );
-- Community messages: INSERT where user is approved member
CREATE POLICY "community_messages_insert" ON public.community_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_community_member(community_id)
    AND (subgroup_id IS NULL OR public.is_subgroup_member(subgroup_id))
  );

-- ==================
-- RPCs
-- ==================

-- Get communities for the current user
CREATE OR REPLACE FUNCTION public.get_communities_for_user()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.last_message_at DESC NULLS LAST), '[]'::json)
  INTO result
  FROM (
    SELECT
      c.id,
      c.name,
      c.description,
      c.image_url,
      c.created_by,
      c.created_at,
      (SELECT COUNT(*) FROM public.community_members WHERE community_id = c.id) AS member_count,
      cm.role AS my_role,
      lm.content AS last_message_preview,
      lm.created_at AS last_message_at,
      (
        SELECT COUNT(*)
        FROM public.community_messages msg
        WHERE msg.community_id = c.id
          AND msg.subgroup_id IS NULL
          AND msg.created_at > cm.last_read_at
      ) AS unread_count
    FROM public.community_members cm
    JOIN public.communities c ON c.id = cm.community_id
    LEFT JOIN LATERAL (
      SELECT content, created_at
      FROM public.community_messages
      WHERE community_id = c.id AND subgroup_id IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    ) lm ON true
    WHERE cm.user_id = auth.uid()
  ) t;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_communities_for_user() TO authenticated;

-- Get community detail
CREATE OR REPLACE FUNCTION public.get_community_detail(p_community_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
  is_admin boolean;
BEGIN
  -- Check caller is a member
  IF NOT public.is_community_member(p_community_id) THEN
    RETURN NULL;
  END IF;

  SELECT public.is_community_admin(p_community_id) INTO is_admin;

  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'description', c.description,
    'image_url', c.image_url,
    'created_by', c.created_by,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'members', COALESCE((
      SELECT json_agg(json_build_object(
        'user_id', cm.user_id,
        'display_name', COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
        'avatar_url', u.raw_user_meta_data->>'avatar_url',
        'role', cm.role,
        'joined_at', cm.joined_at
      ) ORDER BY cm.role ASC, cm.joined_at ASC)
      FROM public.community_members cm
      JOIN auth.users u ON u.id = cm.user_id
      WHERE cm.community_id = p_community_id
    ), '[]'::json),
    'subgroups', COALESCE((
      SELECT json_agg(json_build_object(
        'id', sg.id,
        'name', sg.name,
        'description', sg.description,
        'member_count', (SELECT COUNT(*) FROM public.subgroup_members WHERE subgroup_id = sg.id)
      ) ORDER BY sg.created_at ASC)
      FROM public.community_subgroups sg
      WHERE sg.community_id = p_community_id
    ), '[]'::json),
    'pending_request_count', CASE WHEN is_admin THEN
      (SELECT COUNT(*) FROM public.community_join_requests WHERE community_id = p_community_id)
    ELSE 0 END
  ) INTO result
  FROM public.communities c
  WHERE c.id = p_community_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_detail(uuid) TO authenticated;

-- Get community messages with pagination
CREATE OR REPLACE FUNCTION public.get_community_messages(
  p_community_id uuid,
  p_subgroup_id uuid DEFAULT NULL,
  p_before timestamptz DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  -- Security check: caller must be community member
  IF NOT public.is_community_member(p_community_id) THEN
    RETURN NULL;
  END IF;

  -- Security check: if subgroup specified, caller must be subgroup member
  IF p_subgroup_id IS NOT NULL AND NOT public.is_subgroup_member(p_subgroup_id) THEN
    RETURN NULL;
  END IF;

  -- Fetch messages
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at ASC), '[]'::json)
  INTO result
  FROM (
    SELECT
      msg.id,
      msg.community_id,
      msg.subgroup_id,
      msg.sender_id,
      COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)) AS sender_name,
      u.raw_user_meta_data->>'avatar_url' AS sender_avatar,
      msg.content,
      msg.created_at
    FROM public.community_messages msg
    JOIN auth.users u ON u.id = msg.sender_id
    WHERE msg.community_id = p_community_id
      AND (p_subgroup_id IS NULL AND msg.subgroup_id IS NULL OR msg.subgroup_id = p_subgroup_id)
      AND (p_before IS NULL OR msg.created_at < p_before)
    ORDER BY msg.created_at DESC
    LIMIT p_limit
  ) t;

  -- Update last_read_at for the caller
  UPDATE public.community_members
  SET last_read_at = now()
  WHERE community_id = p_community_id AND user_id = auth.uid();

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_community_messages(uuid, uuid, timestamptz, int) TO authenticated;

-- Get pending join requests (admin only)
CREATE OR REPLACE FUNCTION public.get_pending_join_requests(p_community_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  -- Security: only for community admins
  IF NOT public.is_community_admin(p_community_id) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(json_agg(json_build_object(
    'id', jr.id,
    'community_id', jr.community_id,
    'user_id', jr.user_id,
    'display_name', COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
    'avatar_url', u.raw_user_meta_data->>'avatar_url',
    'message', jr.message,
    'created_at', jr.created_at
  ) ORDER BY jr.created_at ASC), '[]'::json)
  INTO result
  FROM public.community_join_requests jr
  JOIN auth.users u ON u.id = jr.user_id
  WHERE jr.community_id = p_community_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_join_requests(uuid) TO authenticated;

-- Search communities
CREATE OR REPLACE FUNCTION public.search_communities(p_term text, p_limit int DEFAULT 20)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO result
  FROM (
    SELECT
      c.id,
      c.name,
      c.description,
      c.image_url,
      c.created_at,
      (SELECT COUNT(*) FROM public.community_members WHERE community_id = c.id) AS member_count
    FROM public.communities c
    WHERE c.name ILIKE '%' || p_term || '%'
      AND NOT EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = c.id AND user_id = auth.uid()
      )
    ORDER BY c.created_at DESC
    LIMIT p_limit
  ) t;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_communities(text, int) TO authenticated;

-- ==================
-- TRIGGERS
-- ==================

-- Auto-add creator as admin after community creation
CREATE OR REPLACE FUNCTION public.trg_community_auto_add_creator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_auto_add_creator ON public.communities;
CREATE TRIGGER trg_community_auto_add_creator AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.trg_community_auto_add_creator();

-- Notify admins on join request
CREATE OR REPLACE FUNCTION public.trg_notify_join_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor_name text;
  community_name text;
  admin_record RECORD;
BEGIN
  SELECT COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'user_name', split_part(email, '@', 1))
    INTO actor_name FROM auth.users WHERE id = NEW.user_id;
  SELECT name INTO community_name FROM public.communities WHERE id = NEW.community_id;

  FOR admin_record IN
    SELECT user_id FROM public.community_members
    WHERE community_id = NEW.community_id AND role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (admin_record.user_id, 'community_join_request', 'New join request',
      actor_name || ' wants to join ' || community_name,
      json_build_object('community_id', NEW.community_id, 'actor_id', NEW.user_id)::jsonb);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_join_request ON public.community_join_requests;
CREATE TRIGGER trg_notify_join_request AFTER INSERT ON public.community_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_join_request();

-- Notify user on approval (when added as member with role='member')
CREATE OR REPLACE FUNCTION public.trg_notify_community_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  community_name text;
BEGIN
  -- Only notify when role is 'member' (not when auto-adding creator as admin)
  IF NEW.role != 'member' THEN RETURN NEW; END IF;

  SELECT name INTO community_name FROM public.communities WHERE id = NEW.community_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (NEW.user_id, 'community_approved', 'Welcome!',
    'You have been accepted into ' || community_name,
    json_build_object('community_id', NEW.community_id)::jsonb);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_community_approved ON public.community_members;
CREATE TRIGGER trg_notify_community_approved AFTER INSERT ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_community_approved();

-- Rate limit: max 3 communities per user per 24h
CREATE OR REPLACE FUNCTION public.check_community_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.communities
  WHERE created_by = NEW.created_by
    AND created_at > now() - interval '24 hours';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'You can only create 3 communities per day';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_community_limit ON public.communities;
CREATE TRIGGER trg_check_community_limit BEFORE INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.check_community_limit();
