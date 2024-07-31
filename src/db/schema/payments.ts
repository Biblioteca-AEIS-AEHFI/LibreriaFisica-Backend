import { relations } from "drizzle-orm";
import { int, float, text, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

// Historial de Pagos
export const payments = mysqlTable("payments", {
  paymentId: int("reserve_id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.userId),
  adminId: int("admin_id").references(() => users.userId),
  amount: float("amount"),
  reason: text("reason"),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.userId],
    relationName: "paymentsPerUser",
  }),
  admin: one(users, {
    fields: [payments.adminId],
    references: [users.userId],
    relationName: "paymentsPerAdmin",
  }),
}));

export type NewPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;

export const NewPaymentSchema = createInsertSchema(payments);
export const PaymentSchema = createSelectSchema(payments);
