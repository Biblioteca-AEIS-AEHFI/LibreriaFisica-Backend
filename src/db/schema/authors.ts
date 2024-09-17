import { relations } from "drizzle-orm";
import { int, text, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { authorsPerBook } from "./authorsPerBooks";

// Autores
export const authors = mysqlTable("authors", {
  authorId: int("author_id").primaryKey().autoincrement(),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const authorsRelations = relations(authors, ({ many }) => ({
  booksPerAuthor: many(authorsPerBook),
}));

export type NewAuthor = typeof authors.$inferInsert;
export type Author = typeof authors.$inferSelect;

export const NewAuthorSchema = createInsertSchema(authors);
export const AuthorSchema = createSelectSchema(authors);
