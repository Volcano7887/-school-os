import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getCurrentAcademicYear } from "@/lib/academic-years/queries";
import { getFeeRegister, REGISTER_CATEGORIES } from "@/lib/fees/register";

// Amounts are in whole rupees here, not paise — matches the source Excel
// files exactly (they never divide down to paise).
function rupees(paise: number | null): number | string {
  return paise === null ? "" : paise / 100;
}

function excelDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const schoolSlug = url.searchParams.get("schoolSlug");
  const classId = url.searchParams.get("classId") || undefined;
  if (!schoolSlug) return new Response("Missing schoolSlug", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return new Response("Not found", { status: 404 });

  const [school, academicYear] = await Promise.all([
    getSchoolProfile(supabase, schoolId),
    getCurrentAcademicYear(supabase, schoolId),
  ]);
  if (!school || !academicYear) return new Response("Not found", { status: 404 });

  const rows = await getFeeRegister(supabase, schoolId, academicYear.id, { classId });

  const titleRow = [`${school.name} FEES RECORD (${academicYear.name})`];
  const blankRow: string[] = [];
  const headerRow: string[] = ["SR NO", "NAME", "CLASS"];
  for (const c of REGISTER_CATEGORIES) headerRow.push(c, "DATE");
  headerRow.push("TOTAL FEES", "PAID", "BALANCE");

  const dataRows = rows.map((r) => {
    const row: (string | number)[] = [r.srNo, r.name, r.className ?? ""];
    for (const c of REGISTER_CATEGORIES) {
      row.push(rupees(r.cells[c].amount), excelDate(r.cells[c].date));
    }
    row.push(rupees(r.totalFees), rupees(r.paid), rupees(r.balance));
    return row;
  });

  const sheet = XLSX.utils.aoa_to_sheet([titleRow, blankRow, headerRow, ...dataRows]);
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const safeName = school.name.replace(/[^a-z0-9]/gi, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}-fee-register-${academicYear.name}.xlsx"`,
    },
  });
}
