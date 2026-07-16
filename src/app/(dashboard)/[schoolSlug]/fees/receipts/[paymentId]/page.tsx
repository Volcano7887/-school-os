import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getFeeReceipt } from "@/lib/fees/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/link";
import { amountInWords } from "@/lib/numbers/amount-in-words";
import { PrintButton } from "@/components/shared/print-button";
import { ReceiptShareButton } from "@/components/shared/receipt-share-button";

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

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default async function FeeReceiptPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; paymentId: string }>;
}) {
  const { schoolSlug, paymentId } = await params;
  const supabase = await createClient();
  const schoolId = await getSchoolIdBySlug(supabase, schoolSlug);
  if (!schoolId) return null;

  const [school, receipt] = await Promise.all([
    getSchoolProfile(supabase, schoolId),
    getFeeReceipt(supabase, schoolId, paymentId),
  ]);

  if (!school || !receipt) notFound();

  const totalCollected = receipt.amount + receipt.fineAmount;
  const particulars = receipt.periodLabel ? `School Fee — ${receipt.periodLabel}` : "School Fee";

  const whatsAppMessage = [
    `Dear ${receipt.guardianName ?? "Parent"},`,
    `We have received ${inr(totalCollected)} from ${receipt.studentName} (${receipt.className ?? "—"})${
      receipt.periodLabel ? ` for ${receipt.periodLabel}` : ""
    }.`,
    `Receipt No: ${receipt.receiptNo}, Date: ${formatDate(receipt.paidAt)}.`,
    `Thank you — ${school.name}`,
  ].join("\n");

  const whatsAppLink = receipt.guardianPhone
    ? buildWhatsAppLink(receipt.guardianPhone, whatsAppMessage)
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        {receipt.guardianPhone ? (
          <ReceiptShareButton
            paymentId={paymentId}
            phone={receipt.guardianPhone}
            message={whatsAppMessage}
          />
        ) : (
          <p className="self-center text-xs text-muted-foreground">
            Add a guardian phone number to share this receipt on WhatsApp.
          </p>
        )}
        <PrintButton />
      </div>

      <div className="border-2 border-double border-zinc-800 bg-white text-zinc-900 dark:border-zinc-300 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="h-1.5 bg-primary" />

        <div className="space-y-4 p-6">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">{school.name}</h1>
            {school.address && <p className="text-xs text-zinc-600 dark:text-zinc-400">{school.address}</p>}
            {(school.phone || school.email) && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {[school.phone, school.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="border-y border-zinc-400 py-1.5 text-center dark:border-zinc-600">
            <p className="text-sm font-semibold tracking-widest uppercase">Fee Receipt</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span>
              <span className="text-zinc-500 dark:text-zinc-400">Receipt No: </span>
              <span className="font-medium">{receipt.receiptNo}</span>
            </span>
            <span>
              <span className="text-zinc-500 dark:text-zinc-400">Date: </span>
              <span className="font-medium">{formatDate(receipt.paidAt)}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border border-zinc-300 p-3 text-sm dark:border-zinc-700">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Student: </span>
              <span className="font-medium">{receipt.studentName}</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Class: </span>
              <span className="font-medium">{receipt.className ?? "—"}</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Admission No: </span>
              <span className="font-medium">{receipt.admissionNo ?? "—"}</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Guardian: </span>
              <span className="font-medium">{receipt.guardianName ?? "—"}</span>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-zinc-400 dark:border-zinc-600">
                <th className="py-1.5 pr-2 text-left font-semibold">Particulars</th>
                <th className="py-1.5 text-left font-semibold">Mode</th>
                <th className="py-1.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dashed border-zinc-300 dark:border-zinc-700">
                <td className="py-1.5 pr-2">{particulars}</td>
                <td className="py-1.5">{PAYMENT_MODE_LABEL[receipt.paymentMode] ?? receipt.paymentMode}</td>
                <td className="py-1.5 text-right">{inr(receipt.amount)}</td>
              </tr>
              {receipt.discountAmount > 0 && (
                <tr className="border-b border-dashed border-zinc-300 dark:border-zinc-700">
                  <td colSpan={2} className="py-1.5 pr-2 text-green-700 dark:text-green-400">
                    Discount
                  </td>
                  <td className="py-1.5 text-right text-green-700 dark:text-green-400">
                    -{inr(receipt.discountAmount)}
                  </td>
                </tr>
              )}
              {receipt.fineAmount > 0 && (
                <tr className="border-b border-dashed border-zinc-300 dark:border-zinc-700">
                  <td colSpan={2} className="py-1.5 pr-2 text-red-700 dark:text-red-400">
                    Late Fine
                  </td>
                  <td className="py-1.5 text-right text-red-700 dark:text-red-400">
                    +{inr(receipt.fineAmount)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-800 dark:border-zinc-300">
                <td colSpan={2} className="py-2 pr-2 text-base font-bold">
                  Total Paid
                </td>
                <td className="py-2 text-right text-base font-bold">{inr(totalCollected)}</td>
              </tr>
            </tfoot>
          </table>

          <p className="border border-zinc-300 p-2 text-xs italic dark:border-zinc-700">
            {amountInWords(totalCollected)}
          </p>

          {receipt.remarks && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Remarks: {receipt.remarks}</p>
          )}

          <div className="flex items-end justify-between pt-6 text-xs">
            <div className="text-center">
              <div className="w-32 border-t border-zinc-400 dark:border-zinc-600" />
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">Parent/Guardian</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-t border-zinc-400 dark:border-zinc-600" />
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">Authorized Signatory</p>
            </div>
          </div>

          <p className="border-t border-zinc-300 pt-2 text-center text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            This is a computer-generated receipt and does not require a physical stamp.
          </p>
        </div>
      </div>

      {!whatsAppLink && receipt.guardianPhone && (
        <p className="text-right text-xs text-muted-foreground print:hidden">
          That phone number doesn&apos;t look valid — check the student&apos;s profile.
        </p>
      )}
    </div>
  );
}
