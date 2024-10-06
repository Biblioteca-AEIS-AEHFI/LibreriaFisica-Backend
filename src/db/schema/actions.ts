import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const actions = mysqlTable('actions', {
  actionId: int('action_id').primaryKey().autoincrement(),
  name: varchar('name', { length: 45 })
});

//TODO: crear las relaciones

export type NewAction = typeof actions.$inferInsert;
export type Action = typeof actions.$inferSelect;

export const NewActionSchema = createInsertSchema(actions);
export const ActionSchema = createSelectSchema(actions);


