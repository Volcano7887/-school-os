"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildWhatsAppLink } from "@/lib/whatsapp/link";
import {
  buildFeeReminderMessage,
  REMINDER_LANGUAGE_LABEL,
  type ReminderLanguage,
} from "@/lib/whatsapp/reminder-templates";
import type { StudentBalance } from "@/lib/fees/queries";

const LANGUAGES: ReminderLanguage[] = ["en", "hi", "hinglish"];

export function SendReminderDropdown({
  student,
  schoolName,
}: {
  student: StudentBalance;
  schoolName: string;
}) {
  if (!student.guardianPhone) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <MessageCircle className="size-4" />
          Remind
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => {
          const message = buildFeeReminderMessage(lang, {
            guardianName: student.guardianName,
            studentName: student.fullName,
            className: student.className,
            balancePaise: student.balance,
            schoolName,
          });
          const link = buildWhatsAppLink(student.guardianPhone!, message);
          if (!link) return null;

          return (
            <DropdownMenuItem key={lang} asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                {REMINDER_LANGUAGE_LABEL[lang]}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
