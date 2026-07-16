import { z } from "zod";

// Phase 1 scope: only these three roles are assignable from the UI, even
// though the school_role enum has more (teacher/parent/student are
// planned but not built yet).
export const addMemberSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  fullName: z.string().min(1, "Name is required."),
  role: z.enum(["school_admin", "principal", "accountant"]),
});
