import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSchoolIdBySlug, getSchoolProfile } from "@/lib/school/queries";
import { getFeeReceipt } from "@/lib/fees/queries";
import { buildWhatsAppLink } from "@/lib/whatsapp/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/shared/print-button";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  upi: "UPI",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

  const whatsAppMessage = [
    `Dear ${receipt.guardianName ?? "Parent"},`,
    `We have received ₹${(receipt.amount / 100).toLocaleString("en-IN")} from ${receipt.studentName} (${receipt.className ?? "—"})${
      receipt.periodLabel ? ` for ${receipt.periodLabel}` : ""
    }.`,
    `Receipt No: ${receipt.receiptNo}, Date: ${formatDate(receipt.paidAt)}.`,
    `Thank you — ${school.name}`,
  ].join("\n");

  const whatsAppLink = receipt.guardianPhone
    ? buildWhatsAppLink(receipt.guardianPhone, whatsAppMessage)
    : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        {whatsAppLink && (
          <Button asChild variant="outline">
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Send via WhatsApp
            </a>
          </Button>
        )}
        <PrintButton />
      </div>
      {!whatsAppLink && (
        <p className="text-right text-xs text-muted-foreground print:hidden">
          Add a guardian phone number on this student&apos;s profile to send
          receipts via WhatsApp.
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold">{school.name}</h1>
            {school.address && (
              <p className="text-sm text-muted-foreground">{school.address}</p>
            )}
            {school.phone && (
              <p className="text-sm text-muted-foreground">{school.phone}</p>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Fee Receipt</span>
            <span className="text-muted-foreground">{receipt.receiptNo}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Student</p>
              <p>{receipt.studentName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Class</p>
              <p>{receipt.className ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admission No.</p>
              <p>{receipt.admissionNo ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p>{formatDate(receipt.paidAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Mode</p>
              <p>{PAYMENT_MODE_LABEL[receipt.paymentMode] ?? receipt.paymentMode}</p>
            </div>
            {receipt.periodLabel && (
              <div>
                <p className="text-xs text-muted-foreground">Period</p>
                <p>{receipt.periodLabel}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-medium">Amount Received</span>
            <span className="text-xl font-semibold">
              ₹{(receipt.amount / 100).toLocaleString("en-IN")}
            </span>
          </div>

          {receipt.remarks && (
            <p className="text-sm text-muted-foreground">Remarks: {receipt.remarks}</p>
          )}

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            This is a computer-generated receipt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
