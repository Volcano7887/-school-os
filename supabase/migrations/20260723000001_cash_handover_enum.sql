-- New journal source type for cash handovers, added in its own migration
-- (transaction) so it's safe to use in the function created in the next
-- migration — Postgres forbids using a just-added enum value within the
-- same transaction it was added in.
alter type journal_source_type add value 'cash_handover';
