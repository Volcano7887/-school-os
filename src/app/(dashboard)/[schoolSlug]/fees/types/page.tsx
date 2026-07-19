import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug } from "@/lib/school/queries";
import { Card, CardContent } from "@/components/ui/card";

const FEE_TYPES = [
  {
    type: "tuition",
    label: "Monthly Fee",
    code: "4000",
    description: "Regular recurring monthly school fee.",
  },
  {
    type: "admission",
    label: "Admission",
    code: "4010",
    description: "One-time fee collected when a student joins.",
  },
  {
    type: "exam",
    label: "Exam",
    code: "4020",
    description: "Examination fee, collected per term/exam cycle.",
  },
  {
    type: "arrears",
    label: "Arrears",
    code: "4030",
    description: "Dues carried forward from a previous academic year.",
  },
];

export default async function FeeTypesPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const { data: accounts } = await supabase
    .from("ledger_accounts")
    .select("code, name")
    .eq("school_id", schoolId)
    .in(
      "code",
      FEE_TYPES.map((t) => t.code)
    );

  const accountNameByCode = new Map((accounts ?? []).map((a) => [a.code, a.name]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Fees Type</h1>
        <p className="text-sm text-muted-foreground">
          Fee types are fixed to keep your chart of accounts consistent — each
          one posts to its own ledger account automatically.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FEE_TYPES.map((t) => (
          <Card key={t.type}>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="font-medium">{t.label}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {accountNameByCode.get(t.code) ?? `Account ${t.code}`}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
