import { relations } from "drizzle-orm";
import { int, varchar, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

// Tipos de Usuario
export const userTypes = mysqlTable("user_types", {
  userTypeId: int("user_type_id").primaryKey().autoincrement(),
  name: varchar("name", { length: 15 }),
});

export const userTypesRelations = relations(userTypes, ({ many }) => ({
  users: many(users),
}));

export type NewUserType = typeof userTypes.$inferInsert;
export type UserType = typeof userTypes.$inferSelect;

export const NewUserTypeSchema = createInsertSchema(userTypes);
export const UserTypeSchema = createSelectSchema(userTypes);
