import { relations } from "drizzle-orm";
import {
  int,
  text,
  varchar,
  mysqlTable,
  boolean,
  date,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { authorsPerBook } from "./authorsPerBooks";
import { categoriesPerBook } from "./categoriesPerBook";
import { reserves } from "./reserves";
import { loans } from "./loans";
import { z, ZodError } from "zod";

// Libros
export const books = mysqlTable("books", {
  bookId: int("book_id").primaryKey().autoincrement(),
  title: varchar("title", { length: 40 }),
  description: text("description"),
  edition: int("edition").notNull(),
  year: int("year"),
  publisher: varchar("publisher", { length: 45 }),
  language: varchar("language", { length: 15 }),
  location: varchar("location", { length: 50 }),
  isbn: varchar("isbn", { length: 16 }).unique().notNull(),
  totalAmount: int("total_amount").notNull(),
  unitsAvailable: int("units_available").notNull(),
  enabled: boolean("enabled"),
  entryDate: date("entry_date"),
});

export const booksRelations = relations(books, ({ many }) => ({
  authorsPerBook: many(authorsPerBook),
  categories: many(categoriesPerBook),
  reserves: many(reserves),
}));

export const UpdateBookSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  edition: z.string().optional(),
  year: z.number().optional(),
  publisher: z.string().optional(),
  language: z.string().optional(),
  isbn: z.string().optional(),
  totalAmount: z.number().optional(),
});

export const PartialGetBook = z.object({
  title: z.string(),
});

export type NewBook = typeof books.$inferInsert;
export type Book = typeof books.$inferSelect;

export const NewBookSchema = createInsertSchema(books);
export const BookSchema = createSelectSchema(books);
