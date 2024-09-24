import { relations } from "drizzle-orm";
import { int, date, text, varchar, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { books } from "./books";
import { users } from "./users";

// Reservas
export const reserves = mysqlTable("reserves", {
  reserveId: int("reserve_id").primaryKey().autoincrement(),
  bookId: int("book_id").references(() => books.bookId),
  userId: int("user_id").references(() => users.userId),
  createdAt: date("created_at").notNull(),
  checkOutDate: date("checkout"),
  status: varchar("status", { length: 20 }),
});

export const reservesRelations = relations(reserves, ({ one }) => ({
  books: one(books, {
    fields: [reserves.bookId],
    references: [books.bookId],
  }),
  users: one(users, {
    fields: [reserves.userId],
    references: [users.userId],
  }),
}));

export type NewReserve = typeof reserves.$inferInsert;
export type Reserve = typeof reserves.$inferSelect;

export const NewReserveSchema = createInsertSchema(reserves);
export const ReserveSchema = createSelectSchema(reserves);
