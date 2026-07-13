-- Expense Management: categories (each backed by its own expense ledger
-- account), vendors, and expenses (source document -> journal entry,
-- same atomic-posting pattern as record_fee_payment).

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  ledger_account_id uuid not null references ledger_accounts(id),
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index expense_categories_school_id_idx on expense_categories(school_id);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create index vendors_school_id_idx on vendors(school_id);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  expense_category_id uuid not null references expense_categories(id),
  vendor_id uuid references vendors(id),
  amount bigint not null check (amount > 0),
  payment_mode payment_mode not null,
  expense_date date not null default current_date,
  bill_no text,
  remarks text,
  bill_attachment_path text,
  recorded_by uuid not null references auth.users(id),
  journal_entry_id uuid references journal_entries(id),
  created_at timestamptz not null default now()
);

create index expenses_school_id_idx on expenses(school_id);
create index expenses_school_date_idx on expenses(school_id, expense_date);
create index expenses_category_idx on expenses(expense_category_id);

alter table expense_categories enable row level security;
alter table vendors enable row level security;
alter table expenses enable row level security;

create policy expense_categories_select on expense_categories
  for select using (is_school_member(school_id));

create policy expense_categories_insert on expense_categories
  for insert with check (is_school_member(school_id));

create policy vendors_select on vendors
  for select using (is_school_member(school_id));

create policy vendors_insert on vendors
  for insert with check (is_school_member(school_id));

create policy expenses_select on expenses
  for select using (is_school_member(school_id));

-- No direct expenses_insert policy — expenses are only ever created via
-- record_expense() below, which posts the matching journal entry
-- atomically. Nothing else should write directly to this table.

-- ---------------------------------------------------------------------
-- record_expense(): atomic expense + journal entry, mirrors
-- record_fee_payment() but debits the category's expense account and
-- credits Cash/Bank instead.
-- ---------------------------------------------------------------------
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

  return v_expense;
end;
$$;

-- ---------------------------------------------------------------------
-- Storage bucket for bill/invoice attachments — private, school-scoped
-- via the folder path convention "{school_id}/{filename}".
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('bills', 'bills', false)
on conflict (id) do nothing;

create policy bills_select on storage.objects
  for select using (
    bucket_id = 'bills'
    and is_school_member((storage.foldername(name))[1]::uuid)
  );

create policy bills_insert on storage.objects
  for insert with check (
    bucket_id = 'bills'
    and is_school_member((storage.foldername(name))[1]::uuid)
  );
