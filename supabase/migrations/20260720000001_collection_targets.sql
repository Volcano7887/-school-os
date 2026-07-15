alter table schools
  add column if not exists daily_fee_target bigint,
  add column if not exists monthly_fee_target bigint;

comment on column schools.daily_fee_target is 'Daily fee collection goal, in paise. Null = not set.';
comment on column schools.monthly_fee_target is 'Monthly fee collection goal, in paise. Null = not set.';
