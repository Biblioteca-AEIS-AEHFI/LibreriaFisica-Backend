import { relations } from "drizzle-orm";
import { int, varchar, mysqlTable } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

// Reputaciones
export const reputations = mysqlTable("reputation", {
  reputationId: int("reputation_id").primaryKey().autoincrement(),
  name: varchar("name", { length: 25 }),
});

export const reputationRelations = relations(reputations, ({ many }) => ({
  users: many(users),
}));

export type NewReputation = typeof reputations.$inferInsert;
export type Reputation = typeof reputations.$inferSelect;

export const NewReputationSchema = createInsertSchema(reputations);
export const ReputationSchema = createSelectSchema(reputations);
