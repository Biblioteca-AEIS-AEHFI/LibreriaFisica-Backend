import { int, mysqlTable, primaryKey } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { permissions } from "./permissions";

const userPermissions = mysqlTable('user_permissions', {
  userId: int('user_id').references(() => users.userId),
  permissionId: int('permission_id').references(() => permissions.permissionId)
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.permissionId] }),
      pkWithCustomName: primaryKey({
        name: "user_permission",
        columns: [table.userId, table.permissionId],
      }),
  }
})

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  users: one(users, {
    fields: [userPermissions.userId],
    references: [users.userId],
  }),
  permissions: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.permissionId],
  }),
}));

export type NewUserPermissions = typeof userPermissions.$inferInsert;
export type AuthorPerBook = typeof userPermissions.$inferSelect;

export const NewUserPermission = createInsertSchema(userPermissions);
export const userPermissionSchema = createSelectSchema(userPermissions);
