import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z.string().min(2, "School name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

export const updateSchoolSchema = z.object({
  name: z.string().min(2, "School name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  academicYearStartMonth: z.coerce.number().int().min(1).max(12),
});
