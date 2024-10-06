import {
  int,
  varchar,
  mysqlTable,
  smallint,
  timestamp,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const parameters = mysqlTable("parameters", {
  libraryId: int("user_id").primaryKey().autoincrement(),
  major: varchar("major", { length: 45 }),
  image: varchar("image", { length: 45 }),
  loanLimitDays: smallint("loan_limit_days"),
  creationDay: timestamp("creation_day"),
});

export type NewLibrary = typeof parameters.$inferInsert;
export type Library = typeof parameters.$inferSelect;

export const NewLibrarySchema = createInsertSchema(parameters);
export const LibrarySchema = createSelectSchema(parameters);


