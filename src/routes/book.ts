import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { books, NewBookSchema, type Book } from "../db/schema/books";
import { authors, AuthorSchema, type Author } from "../db/schema/authors";
import {
  authorsPerBook,
  type AuthorPerBook,
} from "../db/schema/authorsPerBooks";
import { categories, type Category } from "../db/schema/categories";
import {
  categoriesPerBook,
  type CategoryPerBook,
} from "../db/schema/categoriesPerBook";
import { number, z } from "zod";

type BookResponse = Book & {
  authors: Author[];
  categories: Category[];
};

const BookEditSchema = NewBookSchema.extend({
  authors: z.array(z.number()),
  categories: z.array(z.number()),
});

export const booksRouter = Router();

booksRouter.get("/:bookId", async (req: Request, res: Response) => {
  const bookId = parseInt(req.params.bookId);

  // Fetch book data
  const bookData: Book[] = await db
    .select()
    .from(books)
    .where(eq(books.bookId, bookId));

  if (!bookData[0])
    return res.status(404).json({ e: "Book requested not found" });

  const authorsData: Author[] = await db
    .select({
      authorId: authors.authorId,
      firstName: authors.firstName,
      lastName: authors.lastName,
    })
    .from(authors)
    .leftJoin(authorsPerBook, eq(authors.authorId, authorsPerBook.authorId))
    .where(eq(authorsPerBook.bookId, bookId));

  const categoriesData: Category[] = await db
    .select({
      categoryId: categories.categoryId,
      name: categories.name,
      parentCategoryId: categories.parentCategoryId,
    })
    .from(categories)
    .leftJoin(
      categoriesPerBook,
      eq(categoriesPerBook.categoryId, categories.categoryId)
    )
    .where(eq(categoriesPerBook.bookId, bookId));

  const result: BookResponse = {
    ...bookData[0],
    authors: authorsData,
    categories: categoriesData,
  };

  return res.status(200).json(result);
});

booksRouter.put("/:bookId", async (req: Request, res: Response) => {
  const bookId = parseInt(req.params.bookId);
  if (!bookId) return res.status(400).json({ e: "BookId not specified" });

  // Verify if the book to edit actually exists
  const bookResult = await db
    .select({ bookId: books.bookId })
    .from(books)
    .where(eq(books.bookId, bookId));

  if (!bookResult[0])
    return res.status(404).json({ e: "Book requested not found" });

  // Parse data to be edited
  const bookEdits = BookEditSchema.safeParse(req.body);
  const bookInfo = NewBookSchema.safeParse(req.body);
  if (!(bookInfo.success && bookEdits.success))
    return res.status(400).json({ e: "Book edit request not valid" });

  // Execute the update
  // Book info update
  await db.update(books).set(bookInfo.data).where(eq(books.bookId, bookId));

  // Authors update
  if (bookEdits.data.authors) {
    // Delete current authors
    await db.delete(authorsPerBook).where(eq(authorsPerBook.bookId, bookId));

    let newAuthors: AuthorPerBook[] = [];
    bookEdits.data.authors.forEach((authorId) => {
      newAuthors.push({
        authorId: authorId,
        bookId: bookId,
      } as AuthorPerBook);
    });

    // Append new authors
    await db.insert(authorsPerBook).values(newAuthors);
  }

  // Categories update
  if (bookEdits.data.categories) {
    // Delete current categories
    await db
      .delete(categoriesPerBook)
      .where(eq(categoriesPerBook.bookId, bookId));

    let newCategories: CategoryPerBook[] = [];
    bookEdits.data.categories.forEach((categoryId) => {
      newCategories.push({
        categoryId: categoryId,
        bookId: bookId,
      } as CategoryPerBook);
    });

    // Append new categories
    await db.insert(categoriesPerBook).values(newCategories);
  }

  return res.status(200).json({ msg: "Update successful" });
});
