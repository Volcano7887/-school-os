import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getSchoolProfile } from "@/lib/school/queries";
import { getFeeReceipt } from "@/lib/fees/queries";

// TEMPORARY diagnostic — testing auth + data fetching in isolation, with
// simple JSX (no fonts) to narrow down whether the real receipt data
// pipeline itself is what breaks.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ stage: "auth", error: "not signed in" }, { status: 401 });

    const { data: payment } = await supabase
      .from("fee_payments")
      .select("school_id")
      .eq("id", paymentId)
      .single();
    if (!payment) return Response.json({ stage: "payment-lookup", error: "not found" }, { status: 404 });

    const [school, receipt] = await Promise.all([
      getSchoolProfile(supabase, payment.school_id),
      getFeeReceipt(supabase, payment.school_id, paymentId),
    ]);
    if (!school || !receipt) {
      return Response.json({ stage: "receipt-lookup", error: "not found" }, { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "white",
            fontSize: 40,
            color: "black",
          }}
        >
          {receipt.receiptNo} — {school.name}
        </div>
      ),
      { width: 400, height: 300 }
    );
  } catch (e) {
    return Response.json(
      { stage: "data-and-simple-image", error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
