import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { books, type Book } from "../db/schema/books";
import { authors, type Author } from "../db/schema/authors";
import { authorsPerBook } from "../db/schema/authorsPerBooks";
import { categories, type Category } from "../db/schema/categories";
import { categoriesPerBook } from "../db/schema/categoriesPerBook";

type BookResponse = Book & {
  authors: Author[];
  categories: Category[];
};

export const booksRouter = Router();

booksRouter.get("/:bookId", async (req: Request, res: Response) => {
  const { bookId } = req.params;

  // Fetch book data
  const bookData: Book[] = await db
    .select()
    .from(books)
    .where(eq(books.bookId, parseInt(bookId)));

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
    .where(eq(authorsPerBook.bookId, parseInt(bookId)));

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
    .where(eq(categoriesPerBook.bookId, parseInt(bookId)));

  const result: BookResponse = {
    ...bookData[0],
    authors: authorsData,
    categories: categoriesData,
  };

  return res.status(200).json(result);
});
