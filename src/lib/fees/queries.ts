import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FeeType, PaymentMode } from "@/types/database.types";

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
  admissionNo: string | null;
  totalDue: number;
  totalPaid: number;
  totalDiscount: number;
  balance: number;
  guardianName: string | null;
  guardianPhone: string | null;
};

export async function getStudentBalances(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  academicYearId: string,
  filters: { search?: string; classId?: string }
): Promise<StudentBalance[]> {
  let studentQuery = supabase
    .from("students")
    .select("id, full_name, admission_no, class_id, guardian_name, guardian_phone")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (filters.search) studentQuery = studentQuery.ilike("full_name", `%${filters.search}%`);
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
        .select("student_id, amount, discount_amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId),
      supabase
        .from("student_arrears")
        .select("student_id, amount")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId),
    ]);

  if (!students) return [];

  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const paidByStudent = new Map<string, number>();
  const discountByStudent = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + p.amount);
    discountByStudent.set(
      p.student_id,
      (discountByStudent.get(p.student_id) ?? 0) + p.discount_amount
    );
  }

  const arrearsByStudent = new Map<string, number>();
  for (const a of arrears ?? []) {
    arrearsByStudent.set(a.student_id, (arrearsByStudent.get(a.student_id) ?? 0) + a.amount);
  }

  return students.map((s) => {
    const totalDue =
      (structures ?? [])
        .filter((fs) => fs.class_id === null || fs.class_id === s.class_id)
        .reduce((sum, fs) => sum + fs.amount, 0) + (arrearsByStudent.get(s.id) ?? 0);
    const totalPaid = paidByStudent.get(s.id) ?? 0;
    const totalDiscount = discountByStudent.get(s.id) ?? 0;

    return {
      studentId: s.id,
      fullName: s.full_name,
      className: s.class_id ? (classNameById.get(s.class_id) ?? null) : null,
      admissionNo: s.admission_no,
      totalDue,
      totalPaid,
      totalDiscount,
      balance: totalDue - totalPaid - totalDiscount,
      guardianName: s.guardian_name,
      guardianPhone: s.guardian_phone,
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
  discountAmount: number;
  fineAmount: number;
};

export async function getStudentPayments(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  studentId: string,
  academicYearId: string
): Promise<FeePaymentRecord[]> {
  const { data, error } = await supabase
    .from("fee_payments")
    .select(
      "id, receipt_no, amount, payment_mode, paid_at, period_label, remarks, discount_amount, fine_amount"
    )
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
    discountAmount: p.discount_amount,
    fineAmount: p.fine_amount,
  }));
}

export type FeeReceipt = {
  receiptNo: string;
  amount: number;
  paymentMode: string;
  paidAt: string;
  periodLabel: string | null;
  remarks: string | null;
  discountAmount: number;
  fineAmount: number;
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
    .select(
      "receipt_no, amount, payment_mode, paid_at, period_label, remarks, student_id, discount_amount, fine_amount"
    )
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
    discountAmount: payment.discount_amount,
    fineAmount: payment.fine_amount,
    studentName: student.full_name,
    className,
    admissionNo: student.admission_no,
    guardianName: student.guardian_name,
    guardianEmail: student.guardian_email,
    guardianPhone: student.guardian_phone,
    schoolId,
  };
}

export type PaymentSearchResult = {
  id: string;
  receiptNo: string;
  studentName: string;
  className: string | null;
  amount: number;
  discountAmount: number;
  fineAmount: number;
  paymentMode: string;
  paidAt: string;
};

export async function searchFeePayments(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  filters: {
    search?: string;
    paymentMode?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<PaymentSearchResult[]> {
  let query = supabase
    .from("fee_payments")
    .select(
      "id, receipt_no, amount, discount_amount, fine_amount, payment_mode, paid_at, student_id"
    )
    .eq("school_id", schoolId)
    .order("paid_at", { ascending: false })
    .limit(200);

  if (filters.paymentMode) query = query.eq("payment_mode", filters.paymentMode as PaymentMode);
  if (filters.fromDate) query = query.gte("paid_at", filters.fromDate);
  if (filters.toDate) query = query.lte("paid_at", filters.toDate);

  const { data: payments, error } = await query;
  if (error || !payments) return [];

  const studentIds = [...new Set(payments.map((p) => p.student_id))];
  const { data: students } = studentIds.length
    ? await supabase
        .from("students")
        .select("id, full_name, class_id")
        .in("id", studentIds)
    : { data: [] as { id: string; full_name: string; class_id: string | null }[] };

  const classIds = [...new Set((students ?? []).map((s) => s.class_id).filter(Boolean))] as string[];
  const { data: classes } = classIds.length
    ? await supabase.from("classes").select("id, name").in("id", classIds)
    : { data: [] as { id: string; name: string }[] };
  const classNameById = new Map((classes ?? []).map((c) => [c.id, c.name]));

  const studentById = new Map((students ?? []).map((s) => [s.id, s]));

  let results = payments.map((p) => {
    const student = studentById.get(p.student_id);
    return {
      id: p.id,
      receiptNo: p.receipt_no,
      studentName: student?.full_name ?? "Unknown",
      className: student?.class_id ? (classNameById.get(student.class_id) ?? null) : null,
      amount: p.amount,
      discountAmount: p.discount_amount,
      fineAmount: p.fine_amount,
      paymentMode: p.payment_mode,
      paidAt: p.paid_at,
    };
  });

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    results = results.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) || r.receiptNo.toLowerCase().includes(q)
    );
  }

  return results;
}

export type DiscountedPayment = {
  id: string;
  receiptNo: string;
  studentName: string;
  discountAmount: number;
  paidAt: string;
};

export async function getDiscountedPayments(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  academicYearId: string
): Promise<DiscountedPayment[]> {
  const { data: payments, error } = await supabase
    .from("fee_payments")
    .select("id, receipt_no, discount_amount, paid_at, student_id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .gt("discount_amount", 0)
    .order("paid_at", { ascending: false });

  if (error || !payments) return [];

  const studentIds = [...new Set(payments.map((p) => p.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("students").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  return payments.map((p) => ({
    id: p.id,
    receiptNo: p.receipt_no,
    studentName: nameById.get(p.student_id) ?? "Unknown",
    discountAmount: p.discount_amount,
    paidAt: p.paid_at,
  }));
}

export type CarryForwardCandidate = {
  studentId: string;
  fullName: string;
  className: string | null;
  balance: number;
  alreadyCarried: boolean;
};

export async function getCarryForwardCandidates(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  sourceAcademicYearId: string,
  targetAcademicYearId: string
): Promise<CarryForwardCandidate[]> {
  const [balances, { data: existing }] = await Promise.all([
    getStudentBalances(supabase, schoolId, sourceAcademicYearId, {}),
    supabase
      .from("student_arrears")
      .select("student_id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", targetAcademicYearId)
      .eq("source_academic_year_id", sourceAcademicYearId),
  ]);

  const carriedStudentIds = new Set((existing ?? []).map((e) => e.student_id));

  return balances
    .filter((b) => b.balance > 0)
    .map((b) => ({
      studentId: b.studentId,
      fullName: b.fullName,
      className: b.className,
      balance: b.balance,
      alreadyCarried: carriedStudentIds.has(b.studentId),
    }))
    .sort((a, b) => b.balance - a.balance);
}
