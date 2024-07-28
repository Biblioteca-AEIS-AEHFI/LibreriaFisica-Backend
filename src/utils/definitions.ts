import { z } from "zod";

export const loginSchema = z.object({
  numeroCuenta: z.string(),
  password: z.string().min(8),
});
