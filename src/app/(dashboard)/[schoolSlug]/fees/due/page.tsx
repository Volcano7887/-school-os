import { redirect } from "next/navigation";

// Search Due Fees is now the "Due" tab on the consolidated /fees workspace
// (roadmap §3000-A) — this route stays only so old bookmarks/links land
// somewhere real instead of 404ing.
export default async function SearchDueFeesRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ q?: string; classId?: string }>;
}) {
  const { schoolSlug } = await params;
  const { q, classId } = await searchParams;

  const qs = new URLSearchParams({ view: "due" });
  if (q) qs.set("q", q);
  if (classId) qs.set("classId", classId);

  redirect(`/${schoolSlug}/fees?${qs.toString()}`);
}
