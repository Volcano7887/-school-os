import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FeeType } from "@/types/database.types";

// The exact column layout the user's own Excel fee registers use (verified
// against three real files — Boys/Girls/KG — all identical). Mirroring this
// precisely is the point: familiarity for someone who has tracked fees this
// way for years, not a redesign.
export const MONTHS = [
  "June", "July", "August", "September", "October", "November",
  "December", "January", "February", "March", "April", "May",
] as const;

export const REGISTER_CATEGORIES = [
  "BACK DATE FEES",
  "ADMISSION FEES",
  "EXAM 1",
  "EXAM 2",
  ...MONTHS.map((m) => m.toUpperCase()),
] as const;

export type RegisterCategory = (typeof REGISTER_CATEGORIES)[number];

export type RegisterCell = {
  amount: number | null; // paise
  date: string | null; // ISO date
};

export type FeeRegisterRow = {
  srNo: number;
  studentId: string;
  name: string;
  className: string | null;
  cells: Record<RegisterCategory, RegisterCell>;
  totalFees: number;
  paid: number;
  balance: number;
};

// Which column a payment belongs in, based on its (now persisted) fee_type
// plus the free-text period_label the accountant typed when recording it —
// "June", "Exam 1", etc. A payment that doesn't match a known label still
// counts toward Paid/Balance, it just won't land in a specific column.
function categoryFor(feeType: FeeType, periodLabel: string | null): RegisterCategory | null {
  const label = periodLabel?.trim().toLowerCase() ?? "";

  if (feeType === "admission") return "ADMISSION FEES";
  if (feeType === "arrears") return "BACK DATE FEES";
  if (feeType === "exam") {
    if (label === "exam 1" || label === "exam1") return "EXAM 1";
    if (label === "exam 2" || label === "exam2") return "EXAM 2";
    return null;
  }
  if (feeType === "tuition") {
    const month = MONTHS.find((m) => m.toLowerCase() === label);
    return month ? (month.toUpperCase() as RegisterCategory) : null;
  }
  return null;
}

export async function getFeeRegister(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  academicYearId: string,
  filters: { classId?: string } = {}
): Promise<FeeRegisterRow[]> {
  let studentQuery = supabase
    .from("students")
    .select("id, full_name, class_id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (filters.classId) studentQuery = studentQuery.eq("class_id", filters.classId);

  const [{ data: students }, { data: classes }, { data: structures }, { data: payments }, { data: arrears }] =
    await Promise.all([
      studentQuery,
      supabase.from("classes").select("id, name").eq("school_id", schoolId),
      supabase
        .from("fee_structures")
        .select("class_id, amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId)
        .eq("is_active", true),
      supabase
        .from("fee_payments")
        .select("student_id, amount, discount_amount, fee_type, period_label, paid_at")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId)
        .order("paid_at", { ascending: true }),
      supabase
        .from("student_arrears")
        .select("student_id, amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId),
    ]);

  if (!students) return [];

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const arrearsByStudent = new Map<string, number>();
  for (const a of arrears ?? []) {
    arrearsByStudent.set(a.student_id, (arrearsByStudent.get(a.student_id) ?? 0) + a.amount);
  }

  const paidByStudent = new Map<string, number>();
  const discountByStudent = new Map<string, number>();
  const cellsByStudent = new Map<string, Record<RegisterCategory, RegisterCell>>();

  for (const p of payments ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + p.amount);
    discountByStudent.set(
      p.student_id,
      (discountByStudent.get(p.student_id) ?? 0) + p.discount_amount
    );

    const category = categoryFor(p.fee_type, p.period_label);
    if (!category) continue;

    if (!cellsByStudent.has(p.student_id)) {
      cellsByStudent.set(
        p.student_id,
        Object.fromEntries(
          REGISTER_CATEGORIES.map((c) => [c, { amount: null, date: null }])
        ) as Record<RegisterCategory, RegisterCell>
      );
    }
    const cells = cellsByStudent.get(p.student_id)!;
    // Later payments in the same category (e.g. two "June" entries) sum the
    // amount and keep the most recent date — mirrors how the source Excel
    // sometimes shows one combined figure per month.
    cells[category] = {
      amount: (cells[category].amount ?? 0) + p.amount,
      date: p.paid_at,
    };
  }

  return students.map((s, index) => {
    const cells =
      cellsByStudent.get(s.id) ??
      (Object.fromEntries(
        REGISTER_CATEGORIES.map((c) => [c, { amount: null, date: null }])
      ) as Record<RegisterCategory, RegisterCell>);

    const backDateAmount = arrearsByStudent.get(s.id) ?? 0;
    if (backDateAmount > 0 && cells["BACK DATE FEES"].amount === null) {
      cells["BACK DATE FEES"] = { amount: backDateAmount, date: null };
    }

    const totalFees =
      (structures ?? [])
        .filter((fs) => fs.class_id === null || fs.class_id === s.class_id)
        .reduce((sum, fs) => sum + fs.amount, 0) + backDateAmount;
    const paid = paidByStudent.get(s.id) ?? 0;
    const discount = discountByStudent.get(s.id) ?? 0;

    return {
      srNo: index + 1,
      studentId: s.id,
      name: s.full_name,
      className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
      cells,
      totalFees,
      paid,
      balance: totalFees - paid - discount,
    };
  });
}
