import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FeeType } from "@/types/database.types";

export type FeeStructure = {
  id: string;
  feeType: FeeType;
  name: string;
  amount: number;
  classId: string | null;
  className: string | null;
};

export async function getFeeStructures(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  academicYearId: string
): Promise<FeeStructure[]> {
  const { data: structures, error } = await supabase
    .from("fee_structures")
    .select("id, fee_type, name, amount, class_id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .eq("is_active", true)
    .order("fee_type", { ascending: true });

  if (error || !structures) return [];

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId);

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  return structures.map((s) => ({
    id: s.id,
    feeType: s.fee_type,
    name: s.name,
    amount: s.amount,
    classId: s.class_id,
    className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
  }));
}

export type StudentBalance = {
  studentId: string;
  fullName: string;
  className: string | null;
  totalDue: number;
  totalPaid: number;
  balance: number;
};

export async function getStudentBalances(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  academicYearId: string,
  filters: { search?: string; classId?: string }
): Promise<StudentBalance[]> {
  let studentQuery = supabase
    .from("students")
    .select("id, full_name, class_id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (filters.search) studentQuery = studentQuery.ilike("full_name", `%${filters.search}%`);
  if (filters.classId) studentQuery = studentQuery.eq("class_id", filters.classId);

  const [{ data: students }, { data: classes }, { data: structures }, { data: payments }] =
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
        .select("student_id, amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId),
    ]);

  if (!students) return [];

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const paidByStudent = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + p.amount);
  }

  return students.map((s) => {
    const totalDue = (structures ?? [])
      .filter((fs) => fs.class_id === null || fs.class_id === s.class_id)
      .reduce((sum, fs) => sum + fs.amount, 0);
    const totalPaid = paidByStudent.get(s.id) ?? 0;

    return {
      studentId: s.id,
      fullName: s.full_name,
      className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid,
    };
  });
}

export type FeePaymentRecord = {
  id: string;
  receiptNo: string;
  amount: number;
  paymentMode: string;
  paidAt: string;
  periodLabel: string | null;
  remarks: string | null;
};

export async function getStudentPayments(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  studentId: string,
  academicYearId: string
): Promise<FeePaymentRecord[]> {
  const { data, error } = await supabase
    .from("fee_payments")
    .select("id, receipt_no, amount, payment_mode, paid_at, period_label, remarks")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .eq("academic_year_id", academicYearId)
    .order("paid_at", { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    receiptNo: p.receipt_no,
    amount: p.amount,
    paymentMode: p.payment_mode,
    paidAt: p.paid_at,
    periodLabel: p.period_label,
    remarks: p.remarks,
  }));
}

export type FeeReceipt = {
  receiptNo: string;
  amount: number;
  paymentMode: string;
  paidAt: string;
  periodLabel: string | null;
  remarks: string | null;
  studentName: string;
  className: string | null;
  admissionNo: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  schoolId: string;
};

export async function getFeeReceipt(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  paymentId: string
): Promise<FeeReceipt | null> {
  const { data: payment, error } = await supabase
    .from("fee_payments")
    .select("receipt_no, amount, payment_mode, paid_at, period_label, remarks, student_id")
    .eq("school_id", schoolId)
    .eq("id", paymentId)
    .single();

  if (error || !payment) return null;

  const { data: student } = await supabase
    .from("students")
    .select("full_name, admission_no, guardian_name, guardian_email, guardian_phone, class_id")
    .eq("id", payment.student_id)
    .single();

  if (!student) return null;

  let className: string | null = null;
  if (student.class_id) {
    const { data: cls } = await supabase
      .from("classes")
      .select("name")
      .eq("id", student.class_id)
      .single();
    className = cls?.name ?? null;
  }

  return {
    receiptNo: payment.receipt_no,
    amount: payment.amount,
    paymentMode: payment.payment_mode,
    paidAt: payment.paid_at,
    periodLabel: payment.period_label,
    remarks: payment.remarks,
    studentName: student.full_name,
    className,
    admissionNo: student.admission_no,
    guardianName: student.guardian_name,
    guardianEmail: student.guardian_email,
    guardianPhone: student.guardian_phone,
    schoolId,
  };
}
