-- One-off seed script for a DEMO school so the dashboard can be visually
-- reviewed with realistic data volume. Does NOT touch any real school's
-- data — creates an isolated new tenant. Safe to delete later by removing
-- the "Demo Preview School" row (cascades to everything else).
do $$
declare
  v_user_id uuid := 'a10def33-8e8e-4136-b5f8-33f7a261174c'; -- amersohel9@gmail.com
  v_school_id uuid;
  v_ay_id uuid;
  v_class_id uuid;
  v_student_id uuid;
  v_cat_id uuid;
  v_vendor_id uuid;
  v_staff_id uuid;
  v_fee_amount bigint;
  v_class_names text[] := array['Nursery','LKG','UKG','1st','2nd','3rd','4th','5th'];
  v_class_fees bigint[] := array[250000,280000,300000,350000,380000,400000,420000,450000]; -- paise
  v_first_names text[] := array['Ahmed','Ayaan','Zaid','Bilal','Imran','Faizan','Rehan','Yusuf','Omar','Talha',
                                 'Sameer','Waqas','Danish','Kabir','Arham','Rayyan','Sohail','Adnan','Farhan','Nabeel'];
  v_last_names text[] := array['Khan','Sheikh','Ansari','Sayyed','Qureshi','Malik','Shaikh','Patel','Mirza','Baig'];
  v_expense_names text[] := array['Electricity','Stationary','Maintenance','Transport','Others'];
  v_i int;
  v_j int;
  v_class_idx int;
  v_pay_roll float;
  v_month_offset int;
  v_pay_date date;
  v_amount bigint;
  v_mode payment_mode;
  v_modes payment_mode[] := array['cash','bank','upi'];
begin
  -- The record_* functions call is_school_member(), which checks auth.uid()
  -- — that reads request.jwt.claims, which isn't set on a raw DB-URL
  -- session. Fake it for this session so those functions' internal auth
  -- checks pass for v_user_id (who really is the school_admin we just
  -- created above).
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_id::text, 'role', 'authenticated')::text,
    true
  );

  -- 1. School
  insert into schools (name, slug, address, phone, email, academic_year_start_month,
                        daily_fee_target, monthly_fee_target, created_by)
  values ('Demo Preview School', 'demo-preview', '123 Sample Road, Demo City', '9999999999',
          'demo@example.com', 6, 3500000, 100000000, v_user_id)
  returning id into v_school_id;

  insert into school_users (school_id, user_id, role) values (v_school_id, v_user_id, 'school_admin');

  -- 2. Ledger accounts (mirrors DEFAULT_LEDGER_ACCOUNTS)
  insert into ledger_accounts (school_id, code, name, type, is_system) values
    (v_school_id, '1000', 'Cash in Hand', 'asset', true),
    (v_school_id, '1010', 'Bank Account', 'asset', true),
    (v_school_id, '4000', 'Tuition Fee Income', 'income', true),
    (v_school_id, '4010', 'Admission Fee Income', 'income', true),
    (v_school_id, '4020', 'Exam Fee Income', 'income', true),
    (v_school_id, '4030', 'Arrears Income', 'income', true),
    (v_school_id, '6000', 'Salary Expense', 'expense', true);

  -- 3. Academic year (current)
  insert into academic_years (school_id, name, start_date, end_date, is_current)
  values (v_school_id, '2026-2027', '2026-06-01', '2027-05-31', true)
  returning id into v_ay_id;

  -- 4. Classes + fee structures
  for v_i in 1..array_length(v_class_names, 1) loop
    insert into classes (school_id, name) values (v_school_id, v_class_names[v_i])
    returning id into v_class_id;

    insert into fee_structures (school_id, academic_year_id, class_id, fee_type, name, amount)
    values (v_school_id, v_ay_id, v_class_id, 'tuition', 'Tuition Fee', v_class_fees[v_i]);

    -- 5. ~12 students per class
    for v_j in 1..12 loop
      insert into students (school_id, class_id, admission_no, full_name, gender, admission_date, is_active)
      values (
        v_school_id,
        v_class_id,
        'DP-' || lpad(((v_i - 1) * 12 + v_j)::text, 4, '0'),
        v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int] || ' ' ||
          v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int],
        (array['male','female'])[1 + floor(random() * 2)::int]::student_gender,
        '2026-06-01',
        true
      )
      returning id into v_student_id;

      v_fee_amount := v_class_fees[v_i];
      v_pay_roll := random();

      -- ~65% pay in full, ~20% pay half, ~15% pay nothing this year
      if v_pay_roll < 0.65 then
        v_amount := v_fee_amount;
      elsif v_pay_roll < 0.85 then
        v_amount := (v_fee_amount * 0.5)::bigint;
      else
        v_amount := 0;
      end if;

      if v_amount > 0 then
        -- Spread payments across the last 6 months, weighted toward more
        -- recent months so the Cash Flow chart trends upward like the
        -- reference mockup.
        v_month_offset := case
          when random() < 0.35 then 0
          when random() < 0.60 then 1
          when random() < 0.78 then 2
          when random() < 0.90 then 3
          when random() < 0.97 then 4
          else 5
        end;
        v_pay_date := (current_date - (v_month_offset || ' months')::interval)::date;
        v_mode := v_modes[1 + floor(random() * 3)::int];

        perform record_fee_payment(
          v_school_id, v_student_id, v_ay_id, 'tuition', v_amount, v_mode,
          v_pay_date, 'Annual', null, v_user_id
        );
      end if;
    end loop;
  end loop;

  -- 6. Expense categories + a vendor
  insert into vendors (school_id, name, phone) values (v_school_id, 'Local Supplies Co.', '9876543210')
  returning id into v_vendor_id;

  for v_i in 1..array_length(v_expense_names, 1) loop
    insert into ledger_accounts (school_id, code, name, type)
    values (v_school_id, (5000 + v_i)::text, v_expense_names[v_i] || ' Expense', 'expense');

    insert into expense_categories (school_id, name, ledger_account_id)
    select v_school_id, v_expense_names[v_i], id from ledger_accounts
    where school_id = v_school_id and code = (5000 + v_i)::text
    returning id into v_cat_id;

    -- 4-6 expenses per category spread over the last 6 months
    for v_j in 1..(4 + floor(random() * 3)::int) loop
      v_amount := (500 + floor(random() * 7500))::bigint * 100; -- ₹500–₹8,000 in paise
      v_pay_date := (current_date - (floor(random() * 6)::int || ' months')::interval)::date;
      v_mode := v_modes[1 + floor(random() * 3)::int];

      perform record_expense(
        v_school_id, v_cat_id, v_vendor_id, v_amount, v_mode, v_pay_date,
        'BILL-' || v_i || v_j, null, null, v_user_id
      );
    end loop;
  end loop;

  -- 7. Staff + salary payments (leave 2 unpaid this month for the Action Center alert)
  for v_i in 1..10 loop
    insert into staff (school_id, full_name, designation, monthly_salary)
    values (
      v_school_id,
      v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int] || ' ' ||
        v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int],
      case when v_i <= 7 then 'Teacher' else 'Support Staff' end,
      (15000 + floor(random() * 30000))::bigint * 100
    )
    returning id into v_staff_id;

    if v_i <= 8 then
      perform record_salary_payment(
        v_school_id, v_staff_id,
        (select monthly_salary from staff where id = v_staff_id),
        'bank', date_trunc('month', current_date)::date, current_date, null, v_user_id
      );
    end if;
  end loop;
end $$;
