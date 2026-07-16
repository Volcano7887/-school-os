-- Fees Carry Forward: a student's unpaid balance from one academic year
-- rolls into the next as an "arrears" due. fee_structures are per-class,
-- not per-student, so a per-student outstanding amount needs its own
-- table rather than trying to force it into fee_structures.
create table student_arrears (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  source_academic_year_id uuid not null references academic_years(id) on delete cascade,
  amount bigint not null check (amount > 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  -- A student's balance from a given source year can only be carried
  -- forward once per target year.
  unique (student_id, academic_year_id, source_academic_year_id)
);

create index student_arrears_school_id_idx on student_arrears(school_id);
create index student_arrears_student_idx on student_arrears(student_id, academic_year_id);

alter table student_arrears enable row level security;

create policy student_arrears_select on student_arrears
  for select using (is_school_member(school_id));

-- No cash moves for a carry-forward — it's a due-amount adjustment, not a
-- transaction — so a plain member-scoped insert policy is enough (same
-- permissiveness as classes/students inserts), no SECURITY DEFINER
-- function needed.
create policy student_arrears_insert on student_arrears
  for insert with check (is_school_member(school_id));
