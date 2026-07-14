-- Audit Log: tracks the money-moving actions (fee payments, expenses,
-- salary payments) since those are what actually matter for an
-- accounting product's audit trail. Logged directly inside the 3
-- SECURITY DEFINER functions that create these records, so there's no
-- way to record a payment without it being logged.

create type audit_action as enum ('create', 'update', 'delete');

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  action audit_action not null,
  table_name text not null,
  record_id uuid not null,
  new_data jsonb,
  old_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_school_id_idx on audit_logs(school_id);
create index audit_logs_school_created_idx on audit_logs(school_id, created_at desc);

alter table audit_logs enable row level security;

create policy audit_logs_select on audit_logs
  for select using (is_school_member(school_id));

-- No insert/update/delete policies for regular users — only the
-- SECURITY DEFINER functions below (and future ones) write here,
-- bypassing RLS internally. Audit logs must not be editable by anyone.

-- ---------------------------------------------------------------------
-- Re-create the 3 existing functions to also write an audit_logs row.
-- Same signatures as before (CREATE OR REPLACE), just with one more
-- insert at the end of each.
-- ---------------------------------------------------------------------
create or replace function record_fee_payment(
  p_school_id uuid,
  p_student_id uuid,
  p_academic_year_id uuid,
  p_fee_type fee_type,
  p_amount bigint,
  p_payment_mode payment_mode,
  p_paid_at date,
  p_period_label text,
  p_remarks text,
  p_recorded_by uuid
) returns fee_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt_no text;
  v_debit_code text;
  v_credit_code text;
  v_debit_account_id uuid;
  v_credit_account_id uuid;
  v_journal_entry_id uuid;
  v_payment fee_payments;
begin
  if not is_school_member(p_school_id) then
    raise exception 'not authorized for this school';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  select 'RCPT-' || lpad((count(*) + 1)::text, 5, '0')
  into v_receipt_no
  from fee_payments
  where school_id = p_school_id;

  v_debit_code := case when p_payment_mode = 'cash' then '1000' else '1010' end;
  v_credit_code := case p_fee_type
    when 'tuition' then '4000'
    when 'admission' then '4010'
    when 'exam' then '4020'
    when 'arrears' then '4030'
  end;

  select id into v_debit_account_id
  from ledger_accounts where school_id = p_school_id and code = v_debit_code;

  select id into v_credit_account_id
  from ledger_accounts where school_id = p_school_id and code = v_credit_code;

  if v_debit_account_id is null or v_credit_account_id is null then
    raise exception 'chart of accounts is not set up for this school';
  end if;

  insert into journal_entries (school_id, entry_date, narration, source_type, created_by)
  values (p_school_id, p_paid_at, 'Fee payment (' || p_fee_type || ')', 'fee_payment', p_recorded_by)
  returning id into v_journal_entry_id;

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_debit_account_id, p_amount, 0);

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_credit_account_id, 0, p_amount);

  insert into fee_payments (
    school_id, student_id, academic_year_id, receipt_no, amount,
    payment_mode, period_label, remarks, paid_at, recorded_by, journal_entry_id
  )
  values (
    p_school_id, p_student_id, p_academic_year_id, v_receipt_no, p_amount,
    p_payment_mode, p_period_label, p_remarks, p_paid_at, p_recorded_by, v_journal_entry_id
  )
  returning * into v_payment;

  update journal_entries set source_id = v_payment.id where id = v_journal_entry_id;

  insert into audit_logs (school_id, user_id, action, table_name, record_id, new_data)
  values (p_school_id, p_recorded_by, 'create', 'fee_payments', v_payment.id, to_jsonb(v_payment));

  return v_payment;
end;
$$;

create or replace function record_expense(
  p_school_id uuid,
  p_expense_category_id uuid,
  p_vendor_id uuid,
  p_amount bigint,
  p_payment_mode payment_mode,
  p_expense_date date,
  p_bill_no text,
  p_remarks text,
  p_bill_attachment_path text,
  p_recorded_by uuid
) returns expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debit_account_id uuid;
  v_credit_code text;
  v_credit_account_id uuid;
  v_journal_entry_id uuid;
  v_expense expenses;
begin
  if not is_school_member(p_school_id) then
    raise exception 'not authorized for this school';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  select ledger_account_id into v_debit_account_id
  from expense_categories
  where id = p_expense_category_id and school_id = p_school_id;

  if v_debit_account_id is null then
    raise exception 'expense category not found for this school';
  end if;

  v_credit_code := case when p_payment_mode = 'cash' then '1000' else '1010' end;

  select id into v_credit_account_id
  from ledger_accounts where school_id = p_school_id and code = v_credit_code;

  if v_credit_account_id is null then
    raise exception 'chart of accounts is not set up for this school';
  end if;

  insert into journal_entries (school_id, entry_date, narration, source_type, created_by)
  values (p_school_id, p_expense_date, 'Expense', 'expense', p_recorded_by)
  returning id into v_journal_entry_id;

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_debit_account_id, p_amount, 0);

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_credit_account_id, 0, p_amount);

  insert into expenses (
    school_id, expense_category_id, vendor_id, amount, payment_mode,
    expense_date, bill_no, remarks, bill_attachment_path, recorded_by, journal_entry_id
  )
  values (
    p_school_id, p_expense_category_id, p_vendor_id, p_amount, p_payment_mode,
    p_expense_date, p_bill_no, p_remarks, p_bill_attachment_path, p_recorded_by, v_journal_entry_id
  )
  returning * into v_expense;

  update journal_entries set source_id = v_expense.id where id = v_journal_entry_id;

  insert into audit_logs (school_id, user_id, action, table_name, record_id, new_data)
  values (p_school_id, p_recorded_by, 'create', 'expenses', v_expense.id, to_jsonb(v_expense));

  return v_expense;
end;
$$;

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

  insert into audit_logs (school_id, user_id, action, table_name, record_id, new_data)
  values (p_school_id, p_recorded_by, 'create', 'salary_payments', v_payment.id, to_jsonb(v_payment));

  return v_payment;
end;
$$;
