export type ReminderLanguage = "en" | "hi" | "hinglish";

export const REMINDER_LANGUAGE_LABEL: Record<ReminderLanguage, string> = {
  en: "English",
  hi: "Hindi",
  hinglish: "Hinglish",
};

type ReminderInput = {
  guardianName: string | null;
  studentName: string;
  className: string | null;
  balancePaise: number;
  schoolName: string;
};

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function buildFeeReminderMessage(
  lang: ReminderLanguage,
  input: ReminderInput
): string {
  const amount = inr(input.balancePaise);
  const cls = input.className ?? "";

  if (lang === "hi") {
    const name = input.guardianName ?? "अभिभावक";
    return [
      `प्रिय ${name},`,
      "",
      `यह एक विनम्र अनुरोध है कि ${input.schoolName} में ${input.studentName}${cls ? ` (${cls})` : ""} की ${amount} फीस बकाया है। कृपया जल्द से जल्द फीस जमा करने का कष्ट करें।`,
      "",
      "धन्यवाद।",
    ].join("\n");
  }

  if (lang === "hinglish") {
    const name = input.guardianName ?? "Parent";
    return [
      `Respected ${name},`,
      "",
      `Aapko yaad dilana chahte hain ki ${input.schoolName} mein ${input.studentName}${cls ? ` (${cls})` : ""} ki ${amount} fees abhi tak baaki hai. Kripya jald se jald fees jama karwa dein.`,
      "",
      "Dhanyawad.",
    ].join("\n");
  }

  const name = input.guardianName ?? "Parent";
  return [
    `Dear ${name},`,
    "",
    `This is a gentle reminder that ${amount} is pending as school fees for ${input.studentName}${cls ? ` (${cls})` : ""} at ${input.schoolName}. Kindly clear the dues at your earliest convenience.`,
    "",
    "Thank you.",
  ].join("\n");
}
