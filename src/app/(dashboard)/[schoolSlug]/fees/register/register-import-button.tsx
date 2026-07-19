"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  importFeeRegister,
  type RegisterImportResult,
} from "@/features/fees/register-import";

export function RegisterImportButton({ schoolSlug }: { schoolSlug: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RegisterImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await importFeeRegister(schoolSlug, formData);
      setResult(res);
      if (res.status === "success") {
        router.refresh();
      }
    } catch {
      setResult({ status: "error", message: "Something went wrong reading that file." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Import from Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import fee register</DialogTitle>
          <DialogDescription>
            Upload a file in the same layout as your existing fee records (SR NO, NAME, CLASS,
            then each fee category with its Amount/Date columns). Students are matched by exact
            name + class — anything that doesn&apos;t match is listed below instead of guessed.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
        />

        {result && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
            {result.status === "error" ? (
              <p className="text-destructive">{result.message}</p>
            ) : (
              <>
                <p className="font-medium">
                  {result.created} payment{result.created === 1 ? "" : "s"} recorded.
                </p>
                {result.skippedExisting! > 0 && (
                  <p className="text-muted-foreground">
                    {result.skippedExisting} already recorded — skipped, not duplicated.
                  </p>
                )}
                {result.skippedBackDate! > 0 && (
                  <p className="text-muted-foreground">
                    {result.skippedBackDate} Back Date Fees entries skipped — use Carry Forward
                    for arrears instead.
                  </p>
                )}
                {result.unmatched && result.unmatched.length > 0 && (
                  <div>
                    <p className="font-medium text-destructive">
                      {result.unmatched.length} student{result.unmatched.length === 1 ? "" : "s"}{" "}
                      couldn&apos;t be matched:
                    </p>
                    <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-muted-foreground">
                      {result.unmatched.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
