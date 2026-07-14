// "Click to send" WhatsApp links (wa.me) — no API, no account, no cost.
// Opens WhatsApp with the message pre-filled; a person still has to hit
// send themselves, which is the trade-off for zero setup and zero fees.

export function formatIndianPhoneForWhatsApp(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  // Already has a country code (12 digits starting with 91, or 11-13
  // digits generally) — use as-is. Otherwise assume a bare 10-digit
  // Indian mobile number and prefix +91.
  if (digits.length === 10) return `91${digits}`;
  if (digits.length > 10) return digits;
  return null;
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const formatted = formatIndianPhoneForWhatsApp(phone);
  if (!formatted) return null;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
}
