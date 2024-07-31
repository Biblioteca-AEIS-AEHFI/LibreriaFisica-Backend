import { relations } from "drizzle-orm";
import { int, primaryKey, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { books } from "./books";
import { categories } from "./categories";

// Categorias por Libro
export const categoriesPerBook = mysqlTable(
  "categories_per_book",
  {
    bookId: int("book_id").references(() => books.bookId),
    categoryId: int("category_id").references(() => categories.categoryId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bookId, table.categoryId] }),
      pkWithCustomName: primaryKey({
        name: "author_book",
        columns: [table.bookId, table.categoryId],
      }),
    };
  }
);

export const categoriesPerBookRelations = relations(
  categoriesPerBook,
  ({ one }) => ({
    books: one(books, {
      fields: [categoriesPerBook.bookId],
      references: [books.bookId],
    }),
    categories: one(categories, {
      fields: [categoriesPerBook.categoryId],
      references: [categories.categoryId],
    }),
  })
);

export type NewCategoryPerBook = typeof categoriesPerBook.$inferInsert;
export type CategoryPerBook = typeof categoriesPerBook.$inferSelect;

export const NewCategoryPerBookSchema = createInsertSchema(categoriesPerBook);
export const CategoryPerBookSchema = createSelectSchema(categoriesPerBook);
