import { z } from "zod";

export const loginSchema = z.object({
  account: z.string(),
  password: z.string().min(8),
});
