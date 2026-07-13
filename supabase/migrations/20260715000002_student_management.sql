-- Student Management module: classes + students.
-- Classes are simple persistent grade levels (e.g. "1st", "SR KG"), not
-- re-created per academic year — matches how the user's real schools
-- actually track them (confirmed from her Excel registers).

create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index classes_school_id_idx on classes(school_id);

create type student_gender as enum ('male', 'female', 'other');

create table students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  admission_no text,
  full_name text not null,
  gender student_gender,
  dob date,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  address text,
  admission_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index students_school_id_idx on students(school_id);
create index students_class_id_idx on students(class_id);
create index students_school_name_idx on students(school_id, full_name);

create trigger students_set_updated_at
  before update on students
  for each row execute function set_updated_at();

alter table classes enable row level security;
alter table students enable row level security;

create policy classes_select on classes
  for select using (is_school_member(school_id));

create policy classes_insert on classes
  for insert with check (is_school_member(school_id));

create policy classes_update on classes
  for update using (is_school_member(school_id));

create policy students_select on students
  for select using (is_school_member(school_id));

create policy students_insert on students
  for insert with check (is_school_member(school_id));

create policy students_update on students
  for update using (is_school_member(school_id));
