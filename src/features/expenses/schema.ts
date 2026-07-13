import { z } from "zod";

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
});

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  vendorId: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMode: z.enum(["cash", "bank", "upi"]),
  expenseDate: z.string().min(1, "Date is required"),
  billNo: z.string().optional(),
  remarks: z.string().optional(),
});
