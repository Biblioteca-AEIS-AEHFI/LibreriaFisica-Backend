import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { eq, or } from "drizzle-orm";
import {
  authors,
  authorsPerBook,
  books,
  categories,
  categoriesPerBook,
  copies,
} from "../db/schema";
import { formatAuthorsNames } from "../utils/autoresFormat";
import { numberToOrdinal } from "../utils/editions";

export const searchRouter: Router = Router();

/**
 * @openapi
 * '/search?query=texto':
 *  get:
 *      tags:
 *        - Search
 *      summary: get books by any text (get coincidence in books with the text passed in the query params)
 *      parameters:
 *        - name: name
 *          in: query
 *          description: query text
 *          required: true
 *      responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - message
 *                  - data
 *                properties:
 *                  message:
 *                    type: string
 *                    example: category found successfully
 *                  data:
 *                    type: array 
 *                    items:
 *                      type: object
 *                      example: { bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1, bookEdition: 3ra, stockState: 1 }
 *
 *        5xx:
 *          description: FAILED
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - message
 *                properties:
 *                  message:
 *                    type: string
 *                    example: error while handling data 
 *
 */
searchRouter.get("/", async (req: Request, res: Response) => {
  const searchWord = req.query.query;
  if (searchWord?.length == 0)
    return res.status(400).json({ message: "query was empty" });

  try {
    const categoriesMatched = await db
      .select()
      .from(books)
      .innerJoin(categoriesPerBook, eq(books.bookId, categoriesPerBook.bookId))
      .innerJoin(
        categories,
        eq(categoriesPerBook.categoryId, categories.categoryId)
      )
      .where(eq(categories.name, "%" + searchWord + "%"));
    const authorsMatched = await db
      .select()
      .from(books)
      .innerJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .innerJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(
        or(
          eq(authors.firstName, "%" + searchWord + "%"),
          eq(authors.lastName, "%" + searchWord + "%")
        )
      );
    const booksMatched = await db
      .select()
      .from(books)
      .where(
        or(
          eq(books.isbn, "%" + searchWord + "%"),
          eq(books.title, "%" + searchWord + "%")
        )
      );

    // look for copies of book which state is false. true would means it is not enabled

    const result: Array<any> = [
      ...categoriesMatched,
      ...authorsMatched,
      ...booksMatched,
    ];
    const authorsNames = formatAuthorsNames(result);
    const searchedData: Array<any> = [];
    result.forEach(async (bookEl) => {
      const bookCopies = (
        await db.select().from(copies).where(eq(copies.bookId, bookEl.bookId))
      ).filter((copy) => copy.state == false);
      const authors = authorsNames[bookEl.bookId];
      const ordinal =
        typeof numberToOrdinal(bookEl.edition) == "number"
          ? numberToOrdinal(bookEl.edition)
          : bookEl.edition;
      const stockState = bookCopies.length > 0 ? 1 : 0;
      const bookObj = { authors, bookEdition: ordinal, ...bookEl, stockState };
      searchedData.push(bookObj);
    });

    return res
      .status(200)
      .json({ message: "search handled successfully", data: searchedData });
  } catch (err) {
    return res.status(500).json({ message: "could not process info" });
  }
});
