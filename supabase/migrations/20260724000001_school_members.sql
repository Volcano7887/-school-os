-- Members management: lets a school_admin see who's on their team and
-- what role they have (email, name, role) — auth.users isn't directly
-- queryable from the client, so both reads go through SECURITY DEFINER
-- functions that do their own authorization checks internally.

create or replace function get_school_members(p_school_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role school_role,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_school_member(p_school_id) then
    raise exception 'not authorized for this school';
  end if;

  return query
    select su.user_id, u.email::text, p.full_name, su.role, su.is_active, su.created_at
    from school_users su
    join auth.users u on u.id = su.user_id
    left join profiles p on p.id = su.user_id
    where su.school_id = p_school_id
    order by su.created_at asc;
end;
$$;

-- Used by the "add member" flow to check whether an email already has an
-- account (attach existing user to this school) before falling back to
-- creating a brand new one via the service-role admin client.
create or replace function get_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email);
  return v_user_id;
end;
$$;
