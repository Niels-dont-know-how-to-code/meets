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

## Verification

After running all 3 migrations, verify with:

```sql
-- Check interests policy
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'interests';

-- Check audit_log policy
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'audit_log';

-- Check event limit function
SELECT prosrc FROM pg_proc WHERE proname = 'check_event_limit';
```
