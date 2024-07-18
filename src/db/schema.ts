import {
  mysqlTable,
  primaryKey,
  varchar,
  text,
  int,
  mysqlEnum,
  date,
  boolean,
} from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = mysqlTable("users", {
  userId: int("user_id").primaryKey().autoincrement(), // TODO: Change this to UUID
  numeroCuenta: varchar("numero_cuenta", { length: 15 }),
  firstName: varchar("first_name", { length: 35 }),
  lastName: varchar("last_name", { length: 35 }),
  email: varchar("email", { length: 40 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 8 }),
  account: varchar("account", { length: 11 }).notNull().unique(),
  userType: mysqlEnum("user_type", ["normal", "admin"]).notNull(), // Tipo de Usuario
  // lendingScore: int("lending_score").notNull().default(100), // Reputación -> Nombre (buena, mala, regular)
  password: varchar("password", { length: 60 }).notNull().unique(),
  // verified: boolean("verified").default(false) // TODO: Verified
  // deleted: boolean("deleted").default(false)
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const newUserSchema = createInsertSchema(users);
export const userSchema = createSelectSchema(users);

// Invites
// Request
// Forma03

// Registry API????

// export const books = mysqlTable("books", {
//   bookId: int("book_id").primaryKey().autoincrement(),
//   title: varchar("title", { length: 40 }),
//   description: text("description"),
//   edition: int("edition"),
//   year: int("year"),
//   publisher: varchar("publisher", { length: 30 }),
//   language: varchar("language", { length: 15 }),
//   // language: mysqlEnum("language", ["spanish", "english"]), // Enum
//   isbn: varchar("isbn", { length: 13 }).unique().notNull(),
//   amount: int("amount"),
// });

// export type NewBook = typeof books.$inferInsert;
// export type Book = typeof books.$inferSelect;

// export const authors = mysqlTable("authors", {
//   authorId: int("author_id").primaryKey().autoincrement(),
//   firstName: text("first_name"),
//   lastName: text("last_name"),
// });

// export type NewAuthor = typeof authors.$inferInsert;
// export type Author = typeof authors.$inferSelect;

// export const authorsPerBook = mysqlTable(
//   "authors_per_book",
//   {
//     authorId: int("author_id").references(() => authors.authorId),
//     bookId: int("book_id").references(() => books.bookId),
//   },
//   (table) => {
//     return {
//       pk: primaryKey({ columns: [table.bookId, table.authorId] }),
//       pkWithCustomName: primaryKey({
//         name: "author_book",
//         columns: [table.bookId, table.authorId],
//       }),
//     };
//   }
// );

// export const reserves = mysqlTable("reserves", {
//   reserveId: int("reserve_id").primaryKey().autoincrement(),
//   userId: int("user_id").references(() => users.userId),
//   createdAt: date("created_at"),
//   expiresAt: date("expires_at"),
//   notes: text("notes"),
// });

// export type NewReserve = typeof reserves.$inferInsert;
// export type reserve = typeof reserves.$inferSelect;
