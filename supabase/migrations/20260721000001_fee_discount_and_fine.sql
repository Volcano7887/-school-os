-- Discount + Fine tracking on fee payments (inspired by a reference school
-- ERP screenshot the user liked). Design:
--   - Fine is real cash collected alongside the payment, so it gets its own
--     "Fine Income" ledger account and its own journal_entry_lines credit —
--     the journal stays a true record of cash movement.
--   - Discount never involves cash changing hands — it only reduces what
--     the student owes, so it's stored on the payment row for record-
--     keeping/receipts but posts no journal entry at all.

alter table fee_payments
  add column if not exists discount_amount bigint not null default 0,
  add column if not exists fine_amount bigint not null default 0;

comment on column fee_payments.discount_amount is 'Concession applied, in paise. Reduces the student''s balance; no cash moved, no journal line.';
comment on column fee_payments.fine_amount is 'Late fine collected together with this payment, in paise. Real cash — posted to the Fine Income ledger account.';

-- Backfill the Fine Income account for every existing school (mirrors how
-- default ledger accounts were seeded on school creation).
insert into ledger_accounts (school_id, code, name, type, is_system)
select id, '4040', 'Fine Income', 'income', true
from schools
where not exists (
  select 1 from ledger_accounts
  where ledger_accounts.school_id = schools.id and ledger_accounts.code = '4040'
);

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
  p_recorded_by uuid,
  p_discount_amount bigint default 0,
  p_fine_amount bigint default 0
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
  v_fine_account_id uuid;
  v_journal_entry_id uuid;
  v_payment fee_payments;
begin
  if not is_school_member(p_school_id) then
    raise exception 'not authorized for this school';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  if p_discount_amount < 0 or p_fine_amount < 0 then
    raise exception 'discount and fine must not be negative';
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

  -- Debit cash/bank for the FULL amount actually received, including any
  -- fine collected alongside it.
  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_debit_account_id, p_amount + p_fine_amount, 0);

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_credit_account_id, 0, p_amount);

  if p_fine_amount > 0 then
    select id into v_fine_account_id
    from ledger_accounts where school_id = p_school_id and code = '4040';

    if v_fine_account_id is null then
      raise exception 'Fine Income account is not set up for this school';
    end if;

    insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
    values (v_journal_entry_id, v_fine_account_id, 0, p_fine_amount);
  end if;

  insert into fee_payments (
    school_id, student_id, academic_year_id, receipt_no, amount,
    payment_mode, period_label, remarks, paid_at, recorded_by, journal_entry_id,
    discount_amount, fine_amount
  )
  values (
    p_school_id, p_student_id, p_academic_year_id, v_receipt_no, p_amount,
    p_payment_mode, p_period_label, p_remarks, p_paid_at, p_recorded_by, v_journal_entry_id,
    p_discount_amount, p_fine_amount
  )
  returning * into v_payment;

  update journal_entries set source_id = v_payment.id where id = v_journal_entry_id;

  insert into audit_logs (school_id, user_id, action, table_name, record_id, new_data)
  values (p_school_id, p_recorded_by, 'create', 'fee_payments', v_payment.id, to_jsonb(v_payment));

  return v_payment;
end;
$$;
