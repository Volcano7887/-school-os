-- ledger_accounts only got a SELECT policy in the previous migration —
-- new schools need to seed their default chart of accounts via the app,
-- which requires an INSERT policy too.
create policy ledger_accounts_insert on ledger_accounts
  for insert with check (is_school_member(school_id));
