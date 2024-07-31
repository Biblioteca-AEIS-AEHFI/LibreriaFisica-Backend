import { relations } from "drizzle-orm";
import { int, primaryKey, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { books } from "./books";
import { authors } from "./authors";

// Autores por Libro
export const authorsPerBook = mysqlTable(
  "authors_per_book",
  {
    authorId: int("author_id").references(() => authors.authorId),
    bookId: int("book_id").references(() => books.bookId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bookId, table.authorId] }),
      pkWithCustomName: primaryKey({
        name: "author_book",
        columns: [table.bookId, table.authorId],
      }),
    };
  }
);

export const authorsPerBookRelations = relations(authorsPerBook, ({ one }) => ({
  authors: one(authors, {
    fields: [authorsPerBook.authorId],
    references: [authors.authorId],
  }),
  books: one(books, {
    fields: [authorsPerBook.bookId],
    references: [books.bookId],
  }),
}));

export type NewAuthorPerBook = typeof authorsPerBook.$inferInsert;
export type AuthorPerBook = typeof authorsPerBook.$inferSelect;

export const NewAuthorPerBookSchema = createInsertSchema(authorsPerBook);
export const AuthorPerBookSchema = createSelectSchema(authorsPerBook);
