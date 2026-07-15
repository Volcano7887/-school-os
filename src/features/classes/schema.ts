import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});
