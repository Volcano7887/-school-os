"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp/link";

export function ReceiptShareButton({
  paymentId,
  phone,
  message,
}: {
  paymentId: string;
  phone: string;
  message: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleShare() {
    const link = buildWhatsAppLink(phone, message);
    if (!link) {
      toast.error("That phone number doesn't look valid.");
      return;
    }

    setIsLoading(true);
    try {
      // Going to the CORRECT guardian's chat matters more than
      // auto-attaching the image — the OS share sheet (navigator.share)
      // can attach a file, but WhatsApp's share handler has no way to
      // target a specific contact, so it always asks the person to pick
      // one, risking the wrong recipient. Copying the image to the
      // clipboard first and opening wa.me/<phone> directly guarantees the
      // right chat opens; the image just needs one paste once there.
      let copiedToClipboard = false;
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
          const imageBlob = fetch(`/api/receipts/${paymentId}/image`).then((r) => {
            if (!r.ok) throw new Error("Failed to generate receipt image");
            return r.blob();
          });
          // Passing a Promise (not an already-resolved Blob) preserves the
          // click's "user gesture" association in Safari, which otherwise
          // rejects clipboard writes that happen after an awaited fetch.
          await navigator.clipboard.write([new ClipboardItem({ "image/png": imageBlob })]);
          copiedToClipboard = true;
        } catch {
          copiedToClipboard = false;
        }
      }

      if (copiedToClipboard) {
        toast.info("Receipt image copied — paste it into the chat that just opened.");
        window.open(link, "_blank", "noopener,noreferrer");
        return;
      }

      // Clipboard image copy isn't supported here — download the image
      // instead and open the same correct chat; the image is attached
      // manually, but the recipient is still guaranteed right.
      const res = await fetch(`/api/receipts/${paymentId}/image`);
      if (!res.ok) throw new Error("Failed to generate receipt image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${paymentId}.png`;
      a.click();
      URL.revokeObjectURL(url);

      toast.info("Receipt image downloaded — attach it in the WhatsApp chat that just opened.");
      window.open(link, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Couldn't share the receipt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare} disabled={isLoading}>
      <Share2 className="size-4" />
      {isLoading ? "Preparing…" : "Share on WhatsApp"}
    </Button>
  );
}
