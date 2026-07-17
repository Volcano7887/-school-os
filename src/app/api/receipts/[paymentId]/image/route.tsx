import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getSchoolProfile } from "@/lib/school/queries";
import { getFeeReceipt } from "@/lib/fees/queries";
import { amountInWords } from "@/lib/numbers/amount-in-words";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank Transfer",
  upi: "UPI",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Satori (what ImageResponse renders with) has patchy support for the ₹
// glyph depending on the fallback font it picks, so the generated image
// spells out "Rs." instead — the on-screen/print receipt still uses ₹.
function rs(paise: number) {
  return `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

const row = { display: "flex", justifyContent: "space-between" as const };
const label = { color: "#71717a", fontSize: 20 };
const value = { color: "#18181b", fontSize: 20, fontWeight: 600 };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  const { data: payment } = await supabase
    .from("fee_payments")
    .select("school_id")
    .eq("id", paymentId)
    .single();
  if (!payment) return new Response("Not found", { status: 404 });

  const [school, receipt] = await Promise.all([
    getSchoolProfile(supabase, payment.school_id),
    getFeeReceipt(supabase, payment.school_id, paymentId),
  ]);
  if (!school || !receipt) return new Response("Not found", { status: 404 });

  const totalCollected = receipt.amount + receipt.fineAmount;
  const particulars = receipt.periodLabel ? `School Fee — ${receipt.periodLabel}` : "School Fee";

  let fontRegular: Buffer;
  let fontBold: Buffer;
  try {
    [fontRegular, fontBold] = await Promise.all([
      readFile(join(process.cwd(), "src/assets/fonts/Roboto-Regular.woff")),
      readFile(join(process.cwd(), "src/assets/fonts/Roboto-Bold.woff")),
    ]);
  } catch (err) {
    return Response.json(
      { stage: "font-read", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  try {
    return buildImage(school, receipt, totalCollected, particulars, fontRegular, fontBold);
  } catch (err) {
    return Response.json(
      { stage: "image-render", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

function buildImage(
  school: NonNullable<Awaited<ReturnType<typeof getSchoolProfile>>>,
  receipt: NonNullable<Awaited<ReturnType<typeof getFeeReceipt>>>,
  totalCollected: number,
  particulars: string,
  fontRegular: Buffer,
  fontBold: Buffer
) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: "Roboto",
        }}
      >
        <div style={{ height: 14, backgroundColor: "#4f46e5", display: "flex" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "36px 48px",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#18181b" }}>{school.name}</div>
            {school.address && (
              <div style={{ fontSize: 18, color: "#71717a" }}>{school.address}</div>
            )}
            {(school.phone || school.email) && (
              <div style={{ fontSize: 18, color: "#71717a" }}>
                {[school.phone, school.email].filter(Boolean).join("  ·  ")}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              borderTop: "1px solid #a1a1aa",
              borderBottom: "1px solid #a1a1aa",
              padding: "10px 0",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "#18181b" }}>
              FEE RECEIPT
            </div>
          </div>

          <div style={row}>
            <div style={{ fontSize: 20 }}>
              <span style={label}>Receipt No: </span>
              <span style={value}>{receipt.receiptNo}</span>
            </div>
            <div style={{ fontSize: 20 }}>
              <span style={label}>Date: </span>
              <span style={value}>{formatDate(receipt.paidAt)}</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              border: "1px solid #d4d4d8",
              padding: 18,
              gap: 14,
            }}
          >
            <div style={{ width: "50%", fontSize: 20 }}>
              <span style={label}>Student: </span>
              <span style={value}>{receipt.studentName}</span>
            </div>
            <div style={{ width: "50%", fontSize: 20 }}>
              <span style={label}>Class: </span>
              <span style={value}>{receipt.className ?? "—"}</span>
            </div>
            <div style={{ width: "50%", fontSize: 20 }}>
              <span style={label}>Admission No: </span>
              <span style={value}>{receipt.admissionNo ?? "—"}</span>
            </div>
            <div style={{ width: "50%", fontSize: 20 }}>
              <span style={label}>Guardian: </span>
              <span style={value}>{receipt.guardianName ?? "—"}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                borderTop: "2px solid #18181b",
                borderBottom: "1px solid #a1a1aa",
                padding: "10px 0",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              <div style={{ flex: 2 }}>Particulars</div>
              <div style={{ flex: 1 }}>Mode</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>Amount</div>
            </div>

            <div
              style={{
                display: "flex",
                padding: "10px 0",
                fontSize: 20,
                borderBottom: "1px dashed #d4d4d8",
              }}
            >
              <div style={{ flex: 2 }}>{particulars}</div>
              <div style={{ flex: 1 }}>{PAYMENT_MODE_LABEL[receipt.paymentMode] ?? receipt.paymentMode}</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{rs(receipt.amount)}</div>
            </div>

            {receipt.discountAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  padding: "10px 0",
                  fontSize: 20,
                  color: "#15803d",
                  borderBottom: "1px dashed #d4d4d8",
                }}
              >
                <div style={{ flex: 3 }}>Discount</div>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  -{rs(receipt.discountAmount)}
                </div>
              </div>
            )}

            {receipt.fineAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  padding: "10px 0",
                  fontSize: 20,
                  color: "#b91c1c",
                  borderBottom: "1px dashed #d4d4d8",
                }}
              >
                <div style={{ flex: 3 }}>Late Fine</div>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  +{rs(receipt.fineAmount)}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                borderTop: "2px solid #18181b",
                padding: "12px 0",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              <div style={{ flex: 3 }}>Total Paid</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                {rs(totalCollected)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              border: "1px solid #d4d4d8",
              padding: 14,
              fontSize: 17,
              fontStyle: "italic",
              color: "#3f3f46",
            }}
          >
            {amountInWords(totalCollected)}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
              <div style={{ width: "100%", borderTop: "1px solid #a1a1aa" }} />
              <div style={{ fontSize: 16, color: "#71717a", marginTop: 6 }}>Parent/Guardian</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
              <div style={{ width: "100%", borderTop: "1px solid #a1a1aa" }} />
              <div style={{ fontSize: 16, color: "#71717a", marginTop: 6 }}>Authorized Signatory</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              borderTop: "1px solid #e4e4e7",
              paddingTop: 14,
              fontSize: 14,
              color: "#a1a1aa",
            }}
          >
            This is a computer-generated receipt and does not require a physical stamp.
          </div>
        </div>
      </div>
    ),
    {
      width: 900,
      height: 1180,
      fonts: [
        { name: "Roboto", data: fontRegular, weight: 400, style: "normal" },
        { name: "Roboto", data: fontBold, weight: 700, style: "normal" },
      ],
    }
  );
}
