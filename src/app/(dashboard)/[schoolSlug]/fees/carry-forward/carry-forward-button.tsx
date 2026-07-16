"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { carryForwardArrears } from "@/features/fees/actions";

export function CarryForwardButton({
  schoolSlug,
  studentId,
  amount,
  sourceAcademicYearId,
  targetAcademicYearId,
  alreadyCarried,
}: {
  schoolSlug: string;
  studentId: string;
  amount: number;
  sourceAcademicYearId: string;
  targetAcademicYearId: string;
  alreadyCarried: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (alreadyCarried) {
    return (
      <Button size="sm" variant="outline" disabled>
        Carried Forward
      </Button>
    );
  }

  function handleClick() {
    startTransition(async () => {
      const result = await carryForwardArrears(
        schoolSlug,
        studentId,
        amount,
        sourceAcademicYearId,
        targetAcademicYearId
      );
      if (result.status === "success") {
        toast.success("Balance carried forward to the current year.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Couldn't carry forward this balance.");
      }
    });
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? "Carrying…" : "Carry Forward"}
    </Button>
  );
}
