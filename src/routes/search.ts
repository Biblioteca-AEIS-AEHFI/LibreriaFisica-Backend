import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { eq, or, like } from "drizzle-orm";
import {
  authors,
  authorsPerBook,
  books,
  categories,
  categoriesPerBook,
  copies,
} from "../db/schema";
import { formatAuthorsNames, getAuthorsNames } from "../utils/autoresFormat";
import { numberToOrdinal } from "../utils/editions";
import { getLeastCategory, trackCategories } from "../utils/categories";

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
  
  // Check if searchWord is empty or undefined
  if (!searchWord) {
    return res.status(400).json({ message: "Query was empty" });
  }

  try {
    // Perform a single query that searches across categories, authors, and book titles
    const searchResults = await db
      .selectDistinct()
      .from(books)
      .leftJoin(categoriesPerBook, eq(books.bookId, categoriesPerBook.bookId))
      .leftJoin(categories, eq(categoriesPerBook.categoryId, categories.categoryId))
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(
        or(
          like(categories.name, `%${searchWord}%`),
          like(authors.firstName, `%${searchWord}%`),
          like(authors.lastName, `%${searchWord}%`),
          like(books.title, `%${searchWord}%`),
          like(books.isbn, `%${searchWord}%`)
        )
      );

    // Format authors' names
    const authorsNames = formatAuthorsNames(searchResults);
    const categoriesFound = trackCategories(searchResults)
    const searchedData: Array<any> = [];
    // Use a for...of loop to handle asynchronous operations
    for (const bookEl of searchResults) {
      // if the list is empty it means there are not copies/books available to loan
      // state false indicates the book is available. True means the book is currently in use
      const bookCopies = (
        await db.select().from(copies).where(eq(copies.bookId, bookEl.books.bookId))
      ).filter((copy) => copy.state == false); // only include copies with state == false

      const authorsByBook: string = getAuthorsNames(authorsNames[bookEl.books.bookId]) 
      const ordinalEdition = numberToOrdinal(bookEl.books.edition)
      const stockState = bookCopies.length > 0 ? 1 : 0;

      if (bookEl.categories?.categoryId == undefined) continue

      const bookCategory = getLeastCategory(categoriesFound, bookEl.categories.categoryId)

      const bookObj = {
        authors: authorsByBook.slice(0, -1),
        bookEdition: ordinalEdition,
        bookId: bookEl.books.bookId,
        title: bookEl.books.title,
        isbn: bookEl.books.isbn,
        stockState,
        category: bookCategory
      };
      //bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1, bookEdition: 3ra, stockState: 1 
      if ((searchedData.filter(book => book.bookId == bookObj.bookId)).length == 0) 
        searchedData.push(bookObj);

    }

    return res
      .status(200)
      .json({ message: "Search handled successfully", data: searchedData });
  } catch (err) {
    console.error("Error handling search: ", err);
    return res.status(500).json({ message: "Could not process info" });
  }
});
