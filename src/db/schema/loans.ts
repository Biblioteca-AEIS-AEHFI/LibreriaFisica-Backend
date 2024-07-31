import { relations } from "drizzle-orm";
import { int, date, text, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { books } from "./books";
import { users } from "./users";

// Historial de Prestamos
export const loans = mysqlTable("loans", {
  loanId: int("loan_id").primaryKey().autoincrement(),
  bookId: int("book_id").references(() => books.bookId),
  userId: int("user_id").references(() => users.userId),
  adminId: int("admin_id").references(() => users.userId),
  loanedAt: date("loaned_at"),
  expiresOn: date("expires_on"),
  notes: text("notes"),
});

export const loansRelations = relations(loans, ({ one }) => ({
  book: one(books, {
    fields: [loans.bookId],
    references: [books.bookId],
    relationName: "loansPerBook",
  }),
  user: one(users, {
    fields: [loans.userId],
    references: [users.userId],
    relationName: "loansPerUser",
  }),
  admin: one(users, {
    fields: [loans.adminId],
    references: [users.userId],
    relationName: "loansPerAdmin",
  }),
}));

export type NewLoan = typeof loans.$inferInsert;
export type Loan = typeof loans.$inferSelect;

export const NewLoanSchema = createInsertSchema(loans);
export const LoanSchema = createSelectSchema(loans);
