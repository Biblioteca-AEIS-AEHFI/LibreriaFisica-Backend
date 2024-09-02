import { z } from "zod";

export const loginSchema = z.object({
  numeroCuenta: z.string(),
  password: z.string().min(8),
});

export const categorySchema = z.object({
  categoryId: z.number(),
  name: z.string(),
  icon: z.string(),
  parentCategoryId: z.number(),
  enabled: z.boolean()
})

export interface categoryFormat {
  category_id: number,
  name: string | null,
  children: Array<categoryFormat>
}


