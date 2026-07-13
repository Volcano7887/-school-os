import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  monthlySalary: z.coerce.number().positive("Monthly salary must be greater than 0"),
});

export const salaryPaymentSchema = z.object({
  staffId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMode: z.enum(["cash", "bank", "upi"]),
  payMonth: z.string().min(1, "Month is required"),
  paidAt: z.string().min(1, "Date is required"),
  remarks: z.string().optional(),
});
