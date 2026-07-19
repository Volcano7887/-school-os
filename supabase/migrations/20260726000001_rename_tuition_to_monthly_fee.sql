-- Display-only rename: "Tuition Fee" -> "Monthly Fee" everywhere it shows up
-- (ledger account label, and the narration text on journal entries visible
-- in Ledger). The underlying fee_type enum value ('tuition') is unchanged —
-- this only updates human-readable text.
update ledger_accounts
set name = 'Monthly Fee Income'
where code = '4000' and name = 'Tuition Fee Income';

update journal_entries
set narration = 'Fee payment (monthly fee)'
where narration = 'Fee payment (tuition)';

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
  v_narration text;
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
  v_narration := 'Fee payment (' || (case p_fee_type when 'tuition' then 'monthly fee' else p_fee_type::text end) || ')';

  select id into v_debit_account_id
  from ledger_accounts where school_id = p_school_id and code = v_debit_code;

  select id into v_credit_account_id
  from ledger_accounts where school_id = p_school_id and code = v_credit_code;

  if v_debit_account_id is null or v_credit_account_id is null then
    raise exception 'chart of accounts is not set up for this school';
  end if;

  insert into journal_entries (school_id, entry_date, narration, source_type, created_by)
  values (p_school_id, p_paid_at, v_narration, 'fee_payment', p_recorded_by)
  returning id into v_journal_entry_id;

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
    discount_amount, fine_amount, fee_type
  )
  values (
    p_school_id, p_student_id, p_academic_year_id, v_receipt_no, p_amount,
    p_payment_mode, p_period_label, p_remarks, p_paid_at, p_recorded_by, v_journal_entry_id,
    p_discount_amount, p_fine_amount, p_fee_type
  )
  returning * into v_payment;

  update journal_entries set source_id = v_payment.id where id = v_journal_entry_id;

  insert into audit_logs (school_id, user_id, action, table_name, record_id, new_data)
  values (p_school_id, p_recorded_by, 'create', 'fee_payments', v_payment.id, to_jsonb(v_payment));

  return v_payment;
end;
$$;
