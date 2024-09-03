import { z } from "zod";

export const loginSchema = z.object({
  numeroCuenta: z.string(),
  password: z.string().min(8),
});

export const categorySchema = z.object({
  name: z.string(),
  icon: z.string(),
  parentCategoryId: z.number(),
})

export interface categoryFormat {
  category_id: number,
  name: string | null,
  icon: string | null,
  children: Array<categoryFormat>
}


