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
    setIsLoading(true);
    try {
      const res = await fetch(`/api/receipts/${paymentId}/image`);
      if (!res.ok) throw new Error("Failed to generate receipt image");
      const blob = await res.blob();
      const file = new File([blob], "receipt.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message, title: "Fee Receipt" });
        return;
      }

      // Desktop fallback — wa.me links can't attach files directly (no
      // public API for that without a paid WhatsApp Business setup), so
      // this downloads the image and opens the chat with the text
      // pre-filled; the person attaches the image themselves in one tap.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${paymentId}.png`;
      a.click();
      URL.revokeObjectURL(url);

      const link = buildWhatsAppLink(phone, message);
      if (link) {
        toast.info("Receipt image downloaded — attach it in the WhatsApp chat that just opened.");
        window.open(link, "_blank", "noopener,noreferrer");
      }
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
