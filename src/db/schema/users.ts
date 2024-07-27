import { relations } from "drizzle-orm";
import { int, boolean, varchar, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { userTypes } from "./userTypes";
import { reputations } from "./reputations";
import { reserves } from "./reserves";
import { loans } from "./loans";
import { payments } from "./payments";

// Usuarios
export const users = mysqlTable("users", {
  userId: int("user_id").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 35 }).notNull(),
  secondName: varchar("second_name", { length: 35 }),
  firstSurname: varchar("first_surname", { length: 35 }).notNull(),
  secondSurname: varchar("second_surname", { length: 35 }),
  email: varchar("email", { length: 40 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 8 }),
  account: varchar("account", { length: 11 }).notNull().unique(),
  userType: int("user_type")
    .references(() => userTypes.userTypeId)
    .notNull(),
  reputation: int("reputation")
    .references(() => reputations.reputationId)
    .notNull(),
  password: varchar("password", { length: 60 }).notNull(),
  verified: boolean("verified").default(false),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  userTypes: one(userTypes, {
    fields: [users.userType],
    references: [userTypes.userTypeId],
  }),
  reputations: one(reputations, {
    fields: [users.reputation],
    references: [reputations.reputationId],
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
