import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const permissions = mysqlTable('permissions', {
  permissionId: int('permission_id').primaryKey().autoincrement(),
  name: varchar('name', { length: 45 })
});

//TODO: crear las relaciones

export type NewPermission = typeof permissions.$inferInsert;
export type Permission = typeof permissions.$inferSelect;

export const NewPermissionSchema = createInsertSchema(permissions);
export const PermissionSchema = createSelectSchema(permissions);


