-- Module 1: Authentication + School Management
-- schools, profiles, school_users (membership + role), academic_years
-- Every table below is scoped by school_id and protected by RLS —
-- this is the multi-tenant foundation the rest of School OS builds on.

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Shared helper: updated_at trigger
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Roles (all planned roles defined now; Phase 1 UI only uses
-- school_admin + accountant, per School OS scope)
-- ---------------------------------------------------------------------
create type school_role as enum (
  'super_admin',
  'school_admin',
  'principal',
  'accountant',
  'teacher',
  'parent',
  'student'
);

-- ---------------------------------------------------------------------
-- schools
-- ---------------------------------------------------------------------
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  phone text,
  email text,
  logo_url text,
  academic_year_start_month int not null default 6
    check (academic_year_start_month between 1 and 12),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger schools_set_updated_at
  before update on schools
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- profiles (extends auth.users; auto-created on signup)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- school_users (membership + role, many-to-many: a user can belong to
-- multiple schools — e.g. an accountant working across several schools)
-- ---------------------------------------------------------------------
create table school_users (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role school_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index school_users_school_id_idx on school_users(school_id);
create index school_users_user_id_idx on school_users(user_id);

-- ---------------------------------------------------------------------
-- academic_years
-- ---------------------------------------------------------------------
create table academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create index academic_years_school_id_idx on academic_years(school_id);

-- Only one "current" academic year per school.
create unique index academic_years_one_current_per_school
  on academic_years(school_id)
  where is_current;

-- ---------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER so they don't recurse through
-- RLS on school_users while evaluating policies that call them)
-- ---------------------------------------------------------------------
create or replace function is_school_member(target_school_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from school_users
    where school_id = target_school_id
      and user_id = auth.uid()
      and is_active
  );
$$;

create or replace function is_school_admin(target_school_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from school_users
    where school_id = target_school_id
      and user_id = auth.uid()
      and is_active
      and role in ('school_admin', 'super_admin')
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table schools enable row level security;
alter table profiles enable row level security;
alter table school_users enable row level security;
alter table academic_years enable row level security;

-- schools: any authenticated user can create one (Phase 1 = you creating
-- your own schools directly); membership is what gates read/update after.
create policy schools_select on schools
  for select using (is_school_member(id));

create policy schools_insert on schools
  for insert with check (auth.uid() = created_by);

create policy schools_update on schools
  for update using (is_school_admin(id));

-- profiles: see your own profile, and profiles of anyone who shares a
-- school with you (so member lists / "who received this payment" work).
create policy profiles_select on profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from school_users mine
      join school_users theirs on theirs.school_id = mine.school_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );

create policy profiles_update_own on profiles
  for update using (id = auth.uid());

-- school_users: the creator of a school can add themself as its first
-- member; after that, only an existing school_admin can add/remove members.
create policy school_users_select on school_users
  for select using (is_school_member(school_id));

create policy school_users_insert_self_as_creator on school_users
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from schools
      where id = school_id and created_by = auth.uid()
    )
  );

create policy school_users_insert_by_admin on school_users
  for insert with check (is_school_admin(school_id));

create policy school_users_update on school_users
  for update using (is_school_admin(school_id));

create policy school_users_delete on school_users
  for delete using (is_school_admin(school_id));

-- academic_years: any active member of the school can manage these for
-- now (Phase 1 has only school_admin + accountant using the product).
create policy academic_years_select on academic_years
  for select using (is_school_member(school_id));

create policy academic_years_insert on academic_years
  for insert with check (is_school_member(school_id));

create policy academic_years_update on academic_years
  for update using (is_school_member(school_id));

create policy academic_years_delete on academic_years
  for delete using (is_school_admin(school_id));
