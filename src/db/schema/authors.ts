import { relations } from "drizzle-orm";
import { int, text, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { authorsPerBook } from "./authorsPerBooks";
import { z, ZodError } from "zod";

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

export const PartialGetAuthor = z.object({
  authorName: z.string().min(1, "Author name cannot be empty").optional(),
});

export const UpdateAuthorSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.firstName || data.lastName, {
  message: "At least one of 'firstName' or 'lastName' must be provided",
});
