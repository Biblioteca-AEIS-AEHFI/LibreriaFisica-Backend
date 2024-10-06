import { int, mysqlTable, primaryKey, timestamp } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { permissions } from "./permissions";
import { actions } from "./actions";

const actionsHistory = mysqlTable('actions_history', {
  actionHistoryId: int('admin_id').primaryKey().autoincrement(),
  adminId: int('admin_id').references(() => users.userId),
  actionId: int('action_id').references(() => actions.actionId),
  dateTime: timestamp('data_time')
})

export const actionsHistoryRelations = relations(actionsHistory, ({ one }) => ({
  users: one(users, {
    fields: [actionsHistory.adminId],
    references: [users.userId],
  }),
  actions: one(actions, {
    fields: [actionsHistory.actionId],
    references: [actions.actionId],
  }),
}));

export type NewActionHistory = typeof actionsHistory.$inferInsert;
export type ActionHistory = typeof actionsHistory.$inferSelect;

export const NewActionHistory = createInsertSchema(actionsHistory);
export const ActionHistorySchema = createSelectSchema(actionsHistory);

