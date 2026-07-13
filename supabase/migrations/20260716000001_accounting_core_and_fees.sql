-- Accounting core (chart of accounts + double-entry journal) and Fee
-- Collection. Every fee payment posts a real journal entry so Cash Book
-- and Ledger (later modules) are always correct, never separately
-- reconciled. "Total Due" is a simple annual sum (fee_structures.amount),
-- matching how the user's real Excel registers track it — not a
-- month-by-month proration engine she doesn't actually use.

-- ---------------------------------------------------------------------
-- Chart of accounts
-- ---------------------------------------------------------------------
create type account_type as enum ('asset', 'liability', 'income', 'expense', 'equity');

create table ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  code text not null,
  name text not null,
  type account_type not null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, code)
);

create index ledger_accounts_school_id_idx on ledger_accounts(school_id);

-- ---------------------------------------------------------------------
-- Journal entries (the single source of truth every report reads from)
-- ---------------------------------------------------------------------
create type journal_source_type as enum ('fee_payment', 'expense', 'salary_payment', 'manual');

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  entry_date date not null,
  narration text,
  source_type journal_source_type not null,
  source_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index journal_entries_school_id_idx on journal_entries(school_id);
create index journal_entries_school_date_idx on journal_entries(school_id, entry_date);
create index journal_entries_source_idx on journal_entries(source_type, source_id);

create table journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references journal_entries(id) on delete cascade,
  ledger_account_id uuid not null references ledger_accounts(id),
  debit_amount bigint not null default 0,
  credit_amount bigint not null default 0,
  created_at timestamptz not null default now(),
  check (debit_amount >= 0 and credit_amount >= 0),
  check (debit_amount = 0 or credit_amount = 0)
);

create index journal_entry_lines_entry_idx on journal_entry_lines(journal_entry_id);
create index journal_entry_lines_account_idx on journal_entry_lines(ledger_account_id);

-- ---------------------------------------------------------------------
-- Fee structures — what's chargeable, per class, per academic year
-- ---------------------------------------------------------------------
create type fee_type as enum ('tuition', 'admission', 'exam', 'arrears');

create table fee_structures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  fee_type fee_type not null,
  name text not null,
  amount bigint not null check (amount > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index fee_structures_school_id_idx on fee_structures(school_id);
create index fee_structures_academic_year_idx on fee_structures(academic_year_id);
create index fee_structures_class_id_idx on fee_structures(class_id);

-- ---------------------------------------------------------------------
-- Fee payments — the actual transactions (source document -> journal entry)
-- ---------------------------------------------------------------------
create type payment_mode as enum ('cash', 'bank', 'upi');

create table fee_payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  fee_structure_id uuid references fee_structures(id),
  academic_year_id uuid not null references academic_years(id),
  receipt_no text not null,
  amount bigint not null check (amount > 0),
  payment_mode payment_mode not null,
  period_label text,
  remarks text,
  paid_at date not null default current_date,
  recorded_by uuid not null references auth.users(id),
  journal_entry_id uuid references journal_entries(id),
  created_at timestamptz not null default now(),
  unique (school_id, receipt_no)
);

create index fee_payments_school_id_idx on fee_payments(school_id);
create index fee_payments_student_id_idx on fee_payments(student_id);
create index fee_payments_academic_year_idx on fee_payments(academic_year_id);

-- ---------------------------------------------------------------------
-- Seed default chart of accounts for every existing school (new schools
-- are seeded by application code at creation time — see features/schools).
-- ---------------------------------------------------------------------
insert into ledger_accounts (school_id, code, name, type, is_system)
select s.id, v.code, v.name, v.type::account_type, true
from schools s
cross join (values
  ('1000', 'Cash in Hand', 'asset'),
  ('1010', 'Bank Account', 'asset'),
  ('4000', 'Tuition Fee Income', 'income'),
  ('4010', 'Admission Fee Income', 'income'),
  ('4020', 'Exam Fee Income', 'income'),
  ('4030', 'Arrears Income', 'income')
) as v(code, name, type)
on conflict (school_id, code) do nothing;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table ledger_accounts enable row level security;
alter table journal_entries enable row level security;
alter table journal_entry_lines enable row level security;
alter table fee_structures enable row level security;
alter table fee_payments enable row level security;

create policy ledger_accounts_select on ledger_accounts
  for select using (is_school_member(school_id));

create policy journal_entries_select on journal_entries
  for select using (is_school_member(school_id));

create policy journal_entries_insert on journal_entries
  for insert with check (is_school_member(school_id));

-- journal_entry_lines has no school_id column — authorize via its parent
-- journal entry's school membership instead.
create policy journal_entry_lines_select on journal_entry_lines
  for select using (
    exists (
      select 1 from journal_entries je
      where je.id = journal_entry_id and is_school_member(je.school_id)
    )
  );

create policy journal_entry_lines_insert on journal_entry_lines
  for insert with check (
    exists (
      select 1 from journal_entries je
      where je.id = journal_entry_id and is_school_member(je.school_id)
    )
  );

create policy fee_structures_select on fee_structures
  for select using (is_school_member(school_id));

create policy fee_structures_insert on fee_structures
  for insert with check (is_school_member(school_id));

create policy fee_structures_update on fee_structures
  for update using (is_school_member(school_id));

create policy fee_payments_select on fee_payments
  for select using (is_school_member(school_id));

create policy fee_payments_insert on fee_payments
  for insert with check (is_school_member(school_id));
