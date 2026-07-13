import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type StaffMember = {
  id: string;
  fullName: string;
  designation: string | null;
  monthlySalary: number;
  isActive: boolean;
};

export async function getStaff(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("id, full_name, designation, monthly_salary, is_active")
    .eq("school_id", schoolId)
    .order("full_name", { ascending: true });

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    designation: s.designation,
    monthlySalary: s.monthly_salary,
    isActive: s.is_active,
  }));
}

function firstOfMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

export type StaffWithStatus = StaffMember & {
  paidThisMonth: boolean;
};

export async function getStaffWithCurrentMonthStatus(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<StaffWithStatus[]> {
  const staff = await getStaff(supabase, schoolId);
  const currentMonth = firstOfMonth();

  const { data: payments } = await supabase
    .from("salary_payments")
    .select("staff_id")
    .eq("school_id", schoolId)
    .eq("pay_month", currentMonth);

  const paidStaffIds = new Set((payments ?? []).map((p) => p.staff_id));

  return staff.map((s) => ({ ...s, paidThisMonth: paidStaffIds.has(s.id) }));
}

export type SalaryPaymentRecord = {
  id: string;
  amount: number;
  paymentMode: string;
  payMonth: string;
  paidAt: string;
  remarks: string | null;
};

export async function getSalaryPayments(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  staffId: string
): Promise<SalaryPaymentRecord[]> {
  const { data, error } = await supabase
    .from("salary_payments")
    .select("id, amount, payment_mode, pay_month, paid_at, remarks")
    .eq("school_id", schoolId)
    .eq("staff_id", staffId)
    .order("pay_month", { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    amount: p.amount,
    paymentMode: p.payment_mode,
    payMonth: p.pay_month,
    paidAt: p.paid_at,
    remarks: p.remarks,
  }));
}
