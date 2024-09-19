import { relations } from "drizzle-orm";
import { varchar, int, date, text, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { reserves } from "./reserves";
import { users } from "./users";

// Historial de Prestamos
export const loans = mysqlTable("loans", {
  loanId: int("loan_id").primaryKey().autoincrement(),
  reserveId: int("reserve_id").references(() => reserves.reserveId),
  loanAdminId: int("loan_admin_id").references(() => users.userId),
  receptonAdminId: int('reception_admin_id').references(() => users.userId),
  loanedAt: date("loaned_at").notNull(),
  expiresOn: date("expires_on").notNull(),
  initialNotes: text("initial_notes"),
  finalNotes: text('final_notes'),
  state: varchar('state', { length: 50 }),
});

export type NewLoan = typeof loans.$inferInsert;
export type Loan = typeof loans.$inferSelect;

export const NewLoanSchema = createInsertSchema(loans);
export const LoanSchema = createSelectSchema(loans);

export const loansRelations = relations(loans, ({ one }) => ({
  reserves: one(reserves),
}));

