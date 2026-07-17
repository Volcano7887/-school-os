import { redirect } from "next/navigation";

// Search Fees Payment is now the "History" tab on the consolidated /fees
// workspace (roadmap §3000-A) — this route stays only so old bookmarks/
// links land somewhere real instead of 404ing.
export default async function SearchFeesPaymentRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ q?: string; mode?: string; from?: string; to?: string }>;
}) {
  const { schoolSlug } = await params;
  const { q, mode, from, to } = await searchParams;

  const qs = new URLSearchParams({ view: "history" });
  if (q) qs.set("q", q);
  if (mode) qs.set("mode", mode);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);

  redirect(`/${schoolSlug}/fees?${qs.toString()}`);
}
