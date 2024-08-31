import { type Response } from 'express'
import { z, ZodError } from "zod";

export const loginSchema = z.object({
  numeroCuenta: z.string(),
  password: z.string().min(8),
});

export interface categoryFormat {
  category_id: number,
  name: string | null,
  children: Array<categoryFormat>
}


