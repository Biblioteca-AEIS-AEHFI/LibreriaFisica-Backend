import { relations } from "drizzle-orm";
import { int, boolean, varchar, foreignKey, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { categoriesPerBook } from "./categoriesPerBook";
import { z, ZodError } from "zod";

// Categorias
export const categories = mysqlTable(
  "categories",
  {
    categoryId: int("category_id").primaryKey().autoincrement(),
    parentCategoryId: int("parent_category_id"),
    name: varchar("name", { length: 30 }),
    icon: varchar('icon', { length: 100 }),
    enabled: boolean('enabled')
  },
  (table) => {
    return {
      parentReference: foreignKey({
        columns: [table.parentCategoryId],
        foreignColumns: [table.categoryId],
        name: "parent_category_id_fkey",
      }),
    };
  }
);

export const PartialGetCat = z.object({
  categoryId: z.number(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(categoriesPerBook),
}));

export type NewCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export const NewCategorySchema = createInsertSchema(categories);
export const CategorySchema = createSelectSchema(categories);
