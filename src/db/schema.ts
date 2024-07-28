import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import {
  mysqlTable,
  primaryKey,
  varchar,
  text,
  int,
  date,
  float,
  foreignKey,
} from "drizzle-orm/mysql-core";

// TABLES:

// [x] Users -> Usuarios
// [x] UserTypes -> TipoUsuario
// [x] Reputation -> Reputaciones
// [x] Books -> Libros
// [x] Authors -> Autores
// [x] Categories -> Categorias
// [x] Reserves -> Reservas
// [x] Loans -> HistorialPrestamos
// [x] Payments -> HistorialCobros

// [x] CategoriesPerBook -> CategoriasPorLibro
// [x] AuthorsPerBook -> AutoresPorLibro

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
export const UserTypeSchema = createInsertSchema(userTypes);

// Reputación
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
export const ReputationSchema = createInsertSchema(reputations);

// Usuarios
export const users = mysqlTable("users", {
  userId: int("user_id").primaryKey().autoincrement(),
  numeroCuenta: varchar("numero_cuenta", { length: 15 }).unique(),
  firstName: varchar("first_name", { length: 35 }).notNull(),
  secondName: varchar("second_name", { length: 35 }),
  firstSurname: varchar("first_sur_name", { length: 35 }).notNull(),
  secondSurname: varchar("second_sur_name", { length: 35 }),
  email: varchar("email", { length: 40 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 8 }).unique(),
  userType: int("user_type_id").references(() => userTypes.userTypeId),
  reputation: int("reputation").references(() => reputations.reputationId),
  password: varchar("password", { length: 60 }).notNull().unique(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  reserves: many(reserves),
  loans: many(loans),
  payments: many(payments),
}));

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const NewUserSchema = createInsertSchema(users);
export const UserSchema = createSelectSchema(users);

// Libros
export const books = mysqlTable("books", {
  bookId: int("book_id").primaryKey().autoincrement(),
  title: varchar("title", { length: 40 }),
  description: text("description"),
  edition: int("edition"),
  year: int("year"),
  publisher: varchar("publisher", { length: 30 }),
  language: varchar("language", { length: 15 }),
  isbn: varchar("isbn", { length: 13 }).unique().notNull(),
  amount: int("amount"),
});

export const booksRelations = relations(books, ({ many }) => ({
  authors: many(authorsPerBook),
  categories: many(categoriesPerBook),
  reserves: many(reserves),
  loans: many(loans),
}));

export type NewBook = typeof books.$inferInsert;
export type Book = typeof books.$inferSelect;

export const NewBookSchema = createInsertSchema(books);
export const BookSchema = createSelectSchema(books);

// Crear esquema de actualización parcial para permitir campos opcionales
export const UpdateBookSchema = NewBookSchema.partial();

// Categorias
export const categories = mysqlTable(
  "categories",
  {
    categoryId: int("category_id").primaryKey().autoincrement(),
    parentCategoryId: int("parent_category_id"),
    name: varchar("name", { length: 30 }),
  },
  (table) => {
    return {
      parentReference: foreignKey({
        columns: [table.parentCategoryId],
        foreignColumns: [table.categoryId],
        name: "parent_category_id_fkey",
      }),
    };
  }
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export type NewCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export const NewCategorySchema = createInsertSchema(categories);
export const CategorySchema = createSelectSchema(categories);

// Categorias por Libro
export const categoriesPerBook = mysqlTable(
  "categories_per_book",
  {
    bookId: int("book_id").references(() => books.bookId),
    categoryId: int("category_id").references(() => categories.categoryId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bookId, table.categoryId] }),
      pkWithCustomName: primaryKey({
        name: "author_book",
        columns: [table.bookId, table.categoryId],
      }),
    };
  }
);

export type NewCategoryPerBook = typeof categoriesPerBook.$inferInsert;
export type CategoryPerBook = typeof categoriesPerBook.$inferSelect;

export const NewCategoryPerBookSchema = createInsertSchema(categoriesPerBook);
export const CategoryPerBookSchema = createInsertSchema(categoriesPerBook);

// Autores
export const authors = mysqlTable("authors", {
  authorId: int("author_id").primaryKey().autoincrement(),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const authorsRelations = relations(authors, ({ many }) => ({
  books: many(authorsPerBook),
}));

export type NewAuthor = typeof authors.$inferInsert;
export type Author = typeof authors.$inferSelect;

export const NewAuthorSchema = createInsertSchema(authors);
export const AuthorSchema = createSelectSchema(authors);

// Crear esquema de actualización parcial para permitir campos opcionales
export const UpdateAuthorSchema = NewAuthorSchema.partial();

// Autores por Libro
export const authorsPerBook = mysqlTable(
  "authors_per_book",
  {
    authorId: int("author_id").references(() => authors.authorId),
    bookId: int("book_id").references(() => books.bookId),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bookId, table.authorId] }),
      pkWithCustomName: primaryKey({
        name: "author_book",
        columns: [table.bookId, table.authorId],
      }),
    };
  }
);

export const authorsPerBookRelations = relations(
  authorsPerBook,
  ({ many }) => ({
    authors: many(authors),
    books: many(books),
  })
);

export type NewAuthorPerBook = typeof authorsPerBook.$inferInsert;
export type AuthorPerBook = typeof authorsPerBook.$inferSelect;

export const NewAuthorPerBookSchema = createInsertSchema(authorsPerBook);
export const AuthorPerBookSchema = createInsertSchema(authorsPerBook);

// Reservas
export const reserves = mysqlTable("reserves", {
  reserveId: int("reserve_id").primaryKey().autoincrement(),
  bookId: int("book_id").references(() => books.bookId),
  userId: int("user_id").references(() => users.userId),
  createdAt: date("created_at"),
  returnedOn: date("returned_on"),
  status: varchar("status", { length: 20 }),
  notes: text("notes"),
});

export type NewReserve = typeof reserves.$inferInsert;
export type Reserve = typeof reserves.$inferSelect;

export const NewReserveSchema = createInsertSchema(reserves);
export const ReserveSchema = createSelectSchema(reserves);

// Pagos
export const payments = mysqlTable("payments", {
  paymentId: int("reserve_id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.userId),
  adminId: int("admin_id").references(() => users.userId),
  amount: float("amount"),
  reason: text("reason"),
});

export type NewPayment = typeof payments.$inferInsert;
export type Payment = typeof payments.$inferSelect;

export const NewPaymentSchema = createInsertSchema(payments);
export const PaymentSchema = createSelectSchema(payments);

// Historial de Prestamos
export const loans = mysqlTable("loans", {
  loanId: int("loan_id").primaryKey().autoincrement(),
  bookId: int("book_id").references(() => books.bookId),
  userId: int("user_id").references(() => users.userId),
  adminId: int("admin_id").references(() => users.userId),
  loanedAt: date("loaned_at"),
  expiresOn: date("expires_on"),
  notes: text("notes"),
});

export type NewLoan = typeof loans.$inferInsert;
export type Loan = typeof loans.$inferSelect;

export const NewLoanSchema = createInsertSchema(loans);
export const LoanSchema = createSelectSchema(loans);
