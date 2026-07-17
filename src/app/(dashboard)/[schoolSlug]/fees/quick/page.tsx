import { redirect } from "next/navigation";

// Quick Fees is retired as a separate flow (roadmap §3000-A/D) — the bet is
// that one well-designed Collect flow (advanced fields collapsed, not
// hidden on a whole other page) is fast enough to replace it outright.
// This route stays only so old bookmarks/links land somewhere real.
export default async function QuickFeesRedirect({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;
  redirect(`/${schoolSlug}/fees`);
}
