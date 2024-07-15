import { int, varchar, mysqlTable } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  userId: int("user_id").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 25 }),
  lastName: varchar("last_name", { length: 25 }),
  email: varchar("email", { length: 40 }).notNull().unique(),
  account: varchar("account", { length: 11 }).notNull(),
  numeroCuenta: varchar("numero_cuenta", { length: 11 }).notNull().unique(),
  password: varchar("contrasena", { length: 20 }).notNull()
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
