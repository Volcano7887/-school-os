import { z } from "zod";

export const feeStructureSchema = z.object({
  feeType: z.enum(["tuition", "admission", "exam", "arrears"]),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  classId: z.string().optional(),
});

export const feePaymentSchema = z.object({
  studentId: z.string().min(1),
  feeType: z.enum(["tuition", "admission", "exam", "arrears"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMode: z.enum(["cash", "bank", "upi"]),
  paidAt: z.string().min(1, "Date is required"),
  periodLabel: z.string().optional(),
  remarks: z.string().optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  fineAmount: z.coerce.number().min(0).optional(),
});
