"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getClasses } from "@/lib/students/queries";
import { REGISTER_CATEGORIES, MONTHS, type RegisterCategory } from "@/lib/fees/register";
import type { FeeType } from "@/types/database.types";

export type RegisterImportResult = {
  status: "success" | "error";
  message?: string;
  created?: number;
  skippedExisting?: number;
  skippedBackDate?: number;
  unmatched?: string[];
};

function categoryMapping(
  category: RegisterCategory
): { feeType: FeeType; periodLabel: string | null } | null {
  // BACK DATE FEES is arrears, which needs a source academic year to carry
  // from correctly (see Carry Forward) — a flat import has no way to know
  // that, so it's deliberately not auto-created here.
  if (category === "BACK DATE FEES") return null;
  if (category === "ADMISSION FEES") return { feeType: "admission", periodLabel: null };
  if (category === "EXAM 1") return { feeType: "exam", periodLabel: "Exam 1" };
  if (category === "EXAM 2") return { feeType: "exam", periodLabel: "Exam 2" };
  const month = MONTHS.find((m) => m.toUpperCase() === category);
  return month ? { feeType: "tuition", periodLabel: month } : null;
}

function parseExcelDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim() && value.trim() !== "-") {
    const parts = value.trim().split("/");
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (!Number.isNaN(m) && !Number.isNaN(d) && !Number.isNaN(y)) {
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }
  return new Date().toISOString().slice(0, 10);
}

export async function importFeeRegister(
  schoolSlug: string,
  formData: FormData
): Promise<RegisterImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "No file uploaded." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return { status: "error", message: "School not found." };

  const academicYear = await getCurrentAcademicYear(supabase, schoolId);
  if (!academicYear) return { status: "error", message: "Set up an academic year first." };

  const [classes, { data: students }] = await Promise.all([
    getClasses(supabase, schoolId),
    supabase
      .from("students")
      .select("id, full_name, class_id")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .is("deleted_at", null),
  ]);

  const classIdByName = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const studentByKey = new Map(
    (students ?? []).map((s) => [`${s.full_name.trim().toLowerCase()}|${s.class_id ?? ""}`, s.id])
  );

  let workbook: XLSX.WorkBook;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    return { status: "error", message: "Couldn't read that file — is it a valid .xlsx?" };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  const headerRowIndex = aoa.findIndex((row) => String(row[0]).trim().toUpperCase() === "SR NO");
  if (headerRowIndex === -1) {
    return { status: "error", message: "Couldn't find the header row (expected 'SR NO' in column A)." };
  }
  const header = aoa[headerRowIndex].map((h) => String(h).trim().toUpperCase());

  // The DATE column always immediately follows its category's amount
  // column, matching the source layout exactly.
  const categoryColIndex = new Map<RegisterCategory, number>();
  for (const c of REGISTER_CATEGORIES) {
    const idx = header.indexOf(c);
    if (idx !== -1) categoryColIndex.set(c, idx);
  }

  let created = 0;
  let skippedExisting = 0;
  let skippedBackDate = 0;
  const unmatched = new Set<string>();

  for (let i = headerRowIndex + 1; i < aoa.length; i++) {
    const row = aoa[i];
    const name = String(row[1] ?? "").trim();
    const className = String(row[2] ?? "").trim();
    if (!name) continue;

    const classId = classIdByName.get(className.toLowerCase()) ?? null;
    const studentId = studentByKey.get(`${name.toLowerCase()}|${classId ?? ""}`);
    if (!studentId) {
      unmatched.add(`${name} (${className || "no class"})`);
      continue;
    }

    for (const category of REGISTER_CATEGORIES) {
      const colIndex = categoryColIndex.get(category);
      if (colIndex === undefined) continue;

      const amountRaw = row[colIndex];
      const amount = typeof amountRaw === "number" ? amountRaw : parseFloat(String(amountRaw));
      if (!amount || amount <= 0) continue;

      const mapping = categoryMapping(category);
      if (!mapping) {
        skippedBackDate++;
        continue;
      }

      // Idempotency — running the same file twice (or an updated version
      // of it) must not double-book a payment already recorded this year.
      let existingQuery = supabase
        .from("fee_payments")
        .select("id")
        .eq("school_id", schoolId)
        .eq("student_id", studentId)
        .eq("academic_year_id", academicYear.id)
        .eq("fee_type", mapping.feeType);
      existingQuery =
        mapping.periodLabel === null
          ? existingQuery.is("period_label", null)
          : existingQuery.eq("period_label", mapping.periodLabel);

      const { data: existing } = await existingQuery.maybeSingle();
      if (existing) {
        skippedExisting++;
        continue;
      }

      const paidAt = parseExcelDate(row[colIndex + 1]);

      const { error } = await supabase.rpc("record_fee_payment", {
        p_school_id: schoolId,
        p_student_id: studentId,
        p_academic_year_id: academicYear.id,
        p_fee_type: mapping.feeType,
        p_amount: Math.round(amount * 100),
        p_payment_mode: "cash",
        p_paid_at: paidAt,
        p_period_label: mapping.periodLabel,
        p_remarks: "Imported from Excel fee register",
        p_recorded_by: user.id,
      });

      if (!error) created++;
    }
  }

  revalidatePath(`/${schoolSlug}/fees/register`);
  revalidatePath(`/${schoolSlug}/fees`);

  return {
    status: "success",
    created,
    skippedExisting,
    skippedBackDate,
    unmatched: [...unmatched],
  };
}
