import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

export const studentSchema = z.object({
  fullName: z.string().min(2, "Student name is required"),
  classId: z.string().optional(),
  admissionNo: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
  admissionDate: z.string().optional(),
});
