import { relations, sql } from "drizzle-orm";
import {
  int,
  boolean,
  varchar,
  date,
  mysqlTable,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { userTypes } from "./userTypes";
import { reserves } from "./reserves";
import { loans } from "./loans";
import { payments } from "./payments";

// Usuarios
export const users = mysqlTable("users", {
  userId: int("user_id").primaryKey().autoincrement(),
  creationDate: date('creation_date'),
  numeroCuenta: varchar("numero_cuenta", { length: 15 }).unique(),
  firstName: varchar("first_name", { length: 35 }).notNull(),
  secondName: varchar("second_name", { length: 35 }),
  firstSurname: varchar("first_sur_name", { length: 35 }).notNull(),
  secondSurname: varchar("second_sur_name", { length: 35 }),
  email: varchar("email", { length: 40 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 8 }).unique(),
  userType: int("user_type_id").references(() => userTypes.userTypeId),
  reputation: int("reputation"),
  password: varchar("password", { length: 60 }).notNull().unique(),
  enabled: boolean('enabled').default(true),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  userTypes: one(userTypes, {
    fields: [users.userType],
    references: [userTypes.userTypeId],
  }),
  reserves: many(reserves),
  loans: many(loans, {
    relationName: "loansPerUser",
  }),
  payments: many(payments, {
    relationName: "paymentsPerUser",
  }),
}));

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const NewUserSchema = createInsertSchema(users);
export const UserSchema = createSelectSchema(users);
