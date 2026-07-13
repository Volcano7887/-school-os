-- The create-school flow inserts a school, then reads it back (to get its
-- id/slug) BEFORE the school_users membership row exists — the original
-- schools_select policy only allowed members, so that read-back was blocked
-- by RLS and the whole insert appeared to fail. A creator should always be
-- able to see their own school, membership row or not.
drop policy if exists schools_select on schools;

create policy schools_select on schools
  for select using (is_school_member(id) or created_by = auth.uid());
