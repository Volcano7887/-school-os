-- Salary Management: staff with a defined monthly salary, and salary
-- payments logged per calendar month (unique per staff+month — you can't
-- pay the same person twice for the same month). Unlike Fee Collection's
-- "annual due" model, salary is earned and paid monthly, so "pending"
-- simply means no payment row exists yet for the current month.

create table staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  full_name text not null,
  designation text,
  phone text,
  monthly_salary bigint not null check (monthly_salary > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index staff_school_id_idx on staff(school_id);

create table salary_payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  amount bigint not null check (amount > 0),
  payment_mode payment_mode not null,
  pay_month date not null,
  paid_at date not null default current_date,
  remarks text,
  recorded_by uuid not null references auth.users(id),
  journal_entry_id uuid references journal_entries(id),
  created_at timestamptz not null default now(),
  unique (staff_id, pay_month)
);

create index salary_payments_school_id_idx on salary_payments(school_id);
create index salary_payments_staff_id_idx on salary_payments(staff_id);

alter table staff enable row level security;
alter table salary_payments enable row level security;

create policy staff_select on staff
  for select using (is_school_member(school_id));

create policy staff_insert on staff
  for insert with check (is_school_member(school_id));

create policy staff_update on staff
  for update using (is_school_member(school_id));

create policy salary_payments_select on salary_payments
  for select using (is_school_member(school_id));

-- No direct salary_payments_insert policy — only record_salary_payment()
-- below can create these, same reasoning as expenses: it must always be
-- paired with a journal entry, never inserted alone.

-- ---------------------------------------------------------------------
-- Default "Salary Expense" ledger account, code 6000 — reserved range,
-- separate from user-created expense categories (5000+).
-- ---------------------------------------------------------------------
insert into ledger_accounts (school_id, code, name, type, is_system)
select id, '6000', 'Salary Expense', 'expense', true
from schools
on conflict (school_id, code) do nothing;

-- ---------------------------------------------------------------------
-- record_salary_payment(): atomic payment + journal entry (debit Salary
-- Expense, credit Cash/Bank), same pattern as record_fee_payment /
-- record_expense.
-- ---------------------------------------------------------------------
create or replace function record_salary_payment(
  p_school_id uuid,
  p_staff_id uuid,
  p_amount bigint,
  p_payment_mode payment_mode,
  p_pay_month date,
  p_paid_at date,
  p_remarks text,
  p_recorded_by uuid
) returns salary_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debit_account_id uuid;
  v_credit_code text;
  v_credit_account_id uuid;
  v_journal_entry_id uuid;
  v_payment salary_payments;
begin
  if not is_school_member(p_school_id) then
    raise exception 'not authorized for this school';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  select id into v_debit_account_id
  from ledger_accounts where school_id = p_school_id and code = '6000';

  v_credit_code := case when p_payment_mode = 'cash' then '1000' else '1010' end;

  select id into v_credit_account_id
  from ledger_accounts where school_id = p_school_id and code = v_credit_code;

  if v_debit_account_id is null or v_credit_account_id is null then
    raise exception 'chart of accounts is not set up for this school';
  end if;

  insert into journal_entries (school_id, entry_date, narration, source_type, created_by)
  values (p_school_id, p_paid_at, 'Salary payment', 'salary_payment', p_recorded_by)
  returning id into v_journal_entry_id;

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_debit_account_id, p_amount, 0);

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_credit_account_id, 0, p_amount);

  insert into salary_payments (
    school_id, staff_id, amount, payment_mode, pay_month, paid_at, remarks, recorded_by, journal_entry_id
  )
  values (
    p_school_id, p_staff_id, p_amount, p_payment_mode, p_pay_month, p_paid_at, p_remarks, p_recorded_by, v_journal_entry_id
  )
  returning * into v_payment;

  update journal_entries set source_id = v_payment.id where id = v_journal_entry_id;

  return v_payment;
end;
$$;
