-- Cash Handover: tracks physical cash that has been collected (and sits
-- with the accountant, ledger account 1000 "Cash in Hand") until a
-- principal/admin physically receives it. Modeled as a real transfer
-- journal entry (1000 -> 1005) rather than a separate parallel balance,
-- so it's always consistent with Cash Book / Ledger / Reports for free.

-- ---------------------------------------------------------------------
-- New ledger account: cash once handed over (existing schools backfilled
-- here; new schools get it via DEFAULT_LEDGER_ACCOUNTS at creation time).
-- ---------------------------------------------------------------------
insert into ledger_accounts (school_id, code, name, type, is_system)
select s.id, '1005', 'Cash with Principal', 'asset', true
from schools s
on conflict (school_id, code) do nothing;

-- ---------------------------------------------------------------------
-- cash_handovers — one row per handover event (the digital equivalent of
-- the accountant's signed handover page).
-- ---------------------------------------------------------------------
create table cash_handovers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  amount bigint not null check (amount > 0),
  note text,
  received_by uuid not null references auth.users(id),
  journal_entry_id uuid references journal_entries(id),
  created_at timestamptz not null default now()
);

create index cash_handovers_school_id_idx on cash_handovers(school_id);
create index cash_handovers_school_created_idx on cash_handovers(school_id, created_at desc);

alter table cash_handovers enable row level security;

create policy cash_handovers_select on cash_handovers
  for select using (is_school_member(school_id));

-- No insert/update/delete policy for regular users — only the
-- record_cash_handover() function below (SECURITY DEFINER) writes here,
-- same pattern as fee_payments/expenses/salary_payments.

-- ---------------------------------------------------------------------
-- Role check: who is allowed to confirm receiving cash from the
-- accountant. Deliberately not the accountant themself — the whole point
-- is a second person verifying the physical cash count.
-- ---------------------------------------------------------------------
create or replace function is_school_admin_or_principal(target_school_id uuid)
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
      and role in ('school_admin', 'principal', 'super_admin')
  );
$$;

-- ---------------------------------------------------------------------
-- record_cash_handover — the transfer. Validates the amount doesn't
-- exceed what's actually sitting in 1000 "Cash in Hand" right now (can't
-- hand over cash that isn't there), same defensive pattern as the other
-- record_* functions.
-- ---------------------------------------------------------------------
create or replace function record_cash_handover(
  p_school_id uuid,
  p_amount bigint,
  p_note text,
  p_received_by uuid
) returns cash_handovers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_debit_account_id uuid;
  v_credit_account_id uuid;
  v_available bigint;
  v_journal_entry_id uuid;
  v_handover cash_handovers;
begin
  if not is_school_admin_or_principal(p_school_id) then
    raise exception 'not authorized to receive cash handovers for this school';
  end if;

  if p_amount <= 0 then
    raise exception 'amount must be greater than zero';
  end if;

  select id into v_credit_account_id
  from ledger_accounts where school_id = p_school_id and code = '1000';

  select id into v_debit_account_id
  from ledger_accounts where school_id = p_school_id and code = '1005';

  if v_credit_account_id is null or v_debit_account_id is null then
    raise exception 'chart of accounts is not set up for this school';
  end if;

  select coalesce(sum(jel.debit_amount - jel.credit_amount), 0) into v_available
  from journal_entry_lines jel
  join journal_entries je on je.id = jel.journal_entry_id
  where je.school_id = p_school_id and jel.ledger_account_id = v_credit_account_id;

  if p_amount > v_available then
    raise exception 'amount exceeds cash currently held by the accountant';
  end if;

  insert into journal_entries (school_id, entry_date, narration, source_type, created_by)
  values (p_school_id, current_date, 'Cash handover to Principal', 'cash_handover', p_received_by)
  returning id into v_journal_entry_id;

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_debit_account_id, p_amount, 0);

  insert into journal_entry_lines (journal_entry_id, ledger_account_id, debit_amount, credit_amount)
  values (v_journal_entry_id, v_credit_account_id, 0, p_amount);

  insert into cash_handovers (school_id, amount, note, received_by, journal_entry_id)
  values (p_school_id, p_amount, p_note, p_received_by, v_journal_entry_id)
  returning * into v_handover;

  update journal_entries set source_id = v_handover.id where id = v_journal_entry_id;

  insert into audit_logs (school_id, user_id, action, table_name, record_id, new_data)
  values (p_school_id, p_received_by, 'create', 'cash_handovers', v_handover.id, to_jsonb(v_handover));

  return v_handover;
end;
$$;
