import { Router, type Request, type Response } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import jwt from 'jsonwebtoken';
import {
  books,
  reserves,
  users,
  loans,
  categoriesPerBook,
  BookSchema,
  NewBookSchema,
  UpdateBookSchema,
  type Book,
  type NewBook,
  type CategoryPerBook,
  categories,
  PartialGetCat,
  PartialGetBook,
  authorsPerBook,
  type Category,
  type Author,
  authors,
} from "../db/schema";

export const book: Router = Router();

// Para validación de ID
const idBookSchema = z.object({
  bookId: z.string().regex(/^\d+$/).transform(Number),
});

// Manejando errores
const handleError = (res: Response, error: unknown, message: string) => {
  return res.status(500).json({
    message,
    error,
  });
};

// Validación de esquemas
const validateSchema = (schema: z.ZodSchema<any>, data: any, res: Response) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err: ZodError = result.error;
    res.status(400).json({ errors: err.errors });
    return null;
  }
  return result.data;
};

// Obteniendo todos los libros
book.get("/", async (req: Request, res: Response) => {
  try {
    const result: Book[] = await db.select().from(books);
    return res.status(200).json({
      message: "Books fetched successfully",
      data: result,
    });
  } catch (error) {
    handleError(res, error, "Error fetching books");
  }
});

// Obteniendo un libro
book.get("/:bookId", async (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
    const book = await db.select().from(books).where(eq(books.bookId, bookId));

    if (book.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      message: "Book fetched successfully",
      data: book[0],
    });
  } catch (error) {
    handleError(res, error, "Error searching book");
  }
});

// obtener libro por nombre de categoria
/**
 * @openapi
 *  /books/especialidad/{nombreCategoria}:
 *    get:
 *      tags: 
 *        - Books
 *      summary: get books by category name
 *      parameters:
 *      - name: nombreCategoria
 *        in: path
 *        required: true
 *        description: nombre de la categoría
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
 *                    example: success
 *                  data:
 *                    type: array
 *                    items:
 *                      type: object
 *                      example: { categoryId: 1, bookId: 2 }
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
 *                    example: error while handling books per categories
 * 
 * components:
 *  schemas:
 *    Books:
 *      type: object
 *      required:
 *        - bookId
 *        - title
 *        - description
 *        - edition
 *        - year
 *        - publisher
 *        - language
 *        - isbn 
 *        - amount
 *      properties:
 *        bookId:
 *          type: number
 *          example: 1
 *        title:
 *          type: string
 *          example: fisica nuclear
 *        description:
 *          type: string
 *        edition: 
 *          type: number
 *          example: 3
 *        year: 
 *          type: number
 *          example: 2007
 *        publisher:
 *          type: string
 *        language: 
 *          type: string
 *          example: español
 *        isbn:
 *          type: string
 *          example: 978-0-061-96436-7
 *        amount:
 *          type: number
 *          example: 10
 */
book.get("/especialidad/:categoria", async (req: Request, res: Response) => {
  const categoryName: string = req.params.categoria;
  try {
    const categoryId: any = (
      await db
        .select()
        .from(categories)
        .where(eq(categories.name, categoryName))
    )[0]?.categoryId;
    if (!categoryId)
      return res.status(200).json({ message: "No matching category" });
    const booksIdList: any = await db
      .select()
      .from(categoriesPerBook)
      .where(eq(categoriesPerBook.categoryId, categoryId));
    return res.status(200).json({
      message: "success",
      data: booksIdList,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "error while handling books per categories" });
  }
});

// Creando un libro
/**
 * @openapi
 *  /books/create:
 *    post:
 *      tags:
 *        - Books
 *      summary: create books
 *      requestBody:
 *        content:
 *          application/json:
 *            schema: 
 *              type: object
 *              $ref: #/components/schemas/BooksRequest
 *              example: { "title": "Fisica para ingeniería", "description": "some description", "edition": 10, "year": 2017, "publisher": "publisher", "language": "esp", "isbn": "isbn3", "amount": 15 , "authors": [1,2,3], "categories": [1,2,3] }
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
 *                    example: book created successfully
 *                  data:
 *                    type: object
 *                    $ref: #/components/schemas/Books
 *                    example:  { "title": "Fisica para ingeniería", "description": "some description", "edition": 10, "year": 2017, "publisher": "publisher", "language": "esp", "isbn": "isbn3", "amount": 15 }
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
 *                    example: error creating book 
 *
 * 
 * components:
 *  schemas:
 *    BooksRequest:
 *      type: object
 *      required:
 *        - bookId
 *        - title
 *        - description
 *        - edition
 *        - year
 *        - publisher
 *        - language
 *        - isbn 
 *        - amount
 *        - authors
 *        - categories
 *      properties:
 *        bookId:
 *          type: number
 *          example: 1
 *        title:
 *          type: string
 *          example: fisica nuclear
 *        description:
 *          type: string
 *        edition: 
 *          type: number
 *          example: 3
 *        year: 
 *          type: number
 *          example: 2007
 *        publisher:
 *          type: string
 *        language: 
 *          type: string
 *          example: español
 *        isbn:
 *          type: string
 *          example: 978-0-061-96436-7
 *        amount:
 *          type: number
 *          example: 10
 *        authors:
 *          type: array
 *          items:
 *            type: number
 *            example: [1,2,3]
 *        categories:
 *          type: array
 *          items:
 *            type: number
 *            example: [1,2,3]
 */
book.post("/create", async (req: Request, res: Response) => {
  const bookData = validateSchema(NewBookSchema, req.body, res) as any | null;
  if (!bookData) return res.status(400).json({ message: 'data does not match' });

  try {
    const authorsList: Array<number> = req.body.authors
    const categoriesList: Array<number> = req.body.categories
    const resultId: number = (await db.insert(books).values(bookData).$returningId())[0].bookId;
    const max = Math.max(authorsList.length, categoriesList.length)
    for (let i = 0; i < max; i++) {
      const category: Category = (await db.select().from(categories).where(eq(categories.categoryId, categoriesList[i])))[0]
      if (categoriesList.length > i && category) {
        if (category)
          await db.insert(categoriesPerBook).values({categoryId: categoriesList[i], bookId: resultId})
      } 
      const author: Author = (await db.select().from(authors).where(eq(authors.authorId, authorsList[i])))[0]
      if (authorsList.length > i && author) await db.insert(authorsPerBook).values({authorId: authorsList[i], bookId: resultId})
    }
    const result = await db.select().from(books).where(eq(books.bookId, resultId))
    return res.status(201).json({
      message: "Book created successfully",
      data: result,
    });
  } catch (error) {
    handleError(res, error, "Error creating Book");
  }
});

// Actualizando datos de libro
/**
 * @openapi
 *  /books/update/{bookId}:
 *    patch:
 *      tags:
 *        - Books
 *      summary: Update book details
 *      parameters:
 *        - name: bookId
 *          in: path
 *          required: true
 *          schema:
 *            type: number
 *            example: 1
 *          description: The ID of the book to update
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              $ref: '#/components/schemas/UpdateBookRequest'
 *              example: { "title": "Fisica Avanzada", "description": "some updated description", "edition": 11, "year": 2021, "publisher": "New Publisher", "language": "eng", "isbn": "978-0-061-96436-7", "amount": 20 }
 *      responses:
 *        200:
 *          description: Book updated successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Book with id: 1 updated successfully
 *        404:
 *          description: Book not found
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Book not found
 *        400:
 *          description: Invalid data
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: data does not match
 *        500:
 *          description: Server error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Error updating book
 *
 * components:
 *  schemas:
 *    UpdateBookRequest:
 *      type: object
 *      properties:
 *        title:
 *          type: string
 *          example: Fisica Avanzada
 *        description:
 *          type: string
 *        edition:
 *          type: number
 *          example: 11
 *        year:
 *          type: number
 *          example: 2021
 *        publisher:
 *          type: string
 *        language:
 *          type: string
 *          example: eng
 *        isbn:
 *          type: string
 *          example: 978-0-061-96436-7
 *        amount:
 *          type: number
 *          example: 20
 */
book.patch("/update/:bookId", async (req: Request, res: Response) => {
  const bookData = validateSchema(UpdateBookSchema, req.body, res) as
    | any
    | null;
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (!bookData || bookId === undefined) return;

  try {
    const checkBookQuery = await db
      .select()
      .from(books)
      .where(eq(books.bookId, bookId));

    if (checkBookQuery.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    try {
      await db
        .update(books)
        .set({
          title: bookData.title,
          description: bookData.description,
          edition: bookData.edition,
          year: bookData.year,
          publisher: bookData.publisher,
          language: bookData.language,
          isbn: bookData.isbn,
          totalAmount: bookData.totalAmount,
        })
        .where(eq(books.bookId, bookId));

      res.status(200).json({
        message: `Book with id: ${bookId} updated successfully`,
      });
    } catch (error) {
      handleError(res, error, "Error updating book");
    }
  } catch (error) {
    handleError(res, error, "Error searching for book to update");
  }
});

// Borrando libro
/**
 * @openapi
 *  /books/{bookId}:
 *    delete:
 *      tags:
 *        - Books
 *      summary: Delete a book by ID, including related records
 *      description: Deletes a book from the database using the provided book ID. This also removes any related records associated with the book, such as reviews or references.
 *      parameters:
 *        - name: bookId
 *          in: path
 *          required: true
 *          schema:
 *            type: number
 *            example: 1
 *          description: The unique identifier of the book to be deleted
 *      responses:
 *        200:
 *          description: Book and related records deleted successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Book with id: 1 and related records deleted successfully
 *        404:
 *          description: Book not found
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Book not found
 *        500:
 *          description: Internal server error occurred while deleting the book and related records
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Error deleting book and related records
 */
book.delete("/:bookId", async (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
    await db.transaction(async (trx) => {
      // Verificar si el libro existe
      const checkBookQuery = await trx
        .select()
        .from(books)
        .where(eq(books.bookId, bookId));

      if (checkBookQuery.length === 0) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Eliminar reservas relacionadas
      await trx
        .delete(reserves)
        .where(eq(reserves.bookId, bookId));

      // Eliminar préstamos relacionados
      await trx
        .delete(loans)
        .where(inArray(
          loans.reserveId, 
          trx.select({
            reserveId: reserves.reserveId 
          })
          .from(reserves)
          .where(eq(reserves.bookId, bookId))
        ));

      // Finalmente, eliminar el libro
      await trx.delete(books).where(eq(books.bookId, bookId));

      res.status(200).json({
        message: `Book with id: ${bookId} deleted successfully`,
      });
    });
  } catch (error) {
    handleError(res, error, "Error deleting book and related records");
  }
});


// Crear endpoint para obtener libros por nombre
/**
 * @openapi
 *  /books/{title}:
 *    get:
 *      tags:
 *        - Books
 *      summary: Get books by title
 *      parameters:
 *        - name: title
 *          in: path
 *          required: true
 *          schema:
 *            type: string
 *            example: Fisica para ingeniería
 *          description: The title of the book to search for
 *      responses:
 *        200:
 *          description: Books retrieved successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  data:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Books'
 *                    example:
 *                      - title: Fisica para ingeniería
 *                        description: some description
 *                        edition: 10
 *                        year: 2017
 *                        publisher: publisher
 *                        language: esp
 *                        isbn: isbn3
 *                        amount: 15
 *        404:
 *          description: No books found with the given title
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: No books found with title: Fisica para ingeniería
 *        500:
 *          description: Server error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Error retrieving books
 */
book.get("/:title", async (req: Request, res: Response) => {
  let { title } = validateSchema(PartialGetBook, req.params, res) || {};
  title = title.trim();

  if (title === undefined) return;

  try {
    const booksList: any = await db
      .select()
      .from(books)
      .where(sql`lower(${books.title}) = ${title.toLowerCase}`);
    return res.status(200).json({
      message: "success",
      data: booksList,
    });
  } catch (error) {
    handleError(res, error, "");
  }
});

// Crear endpoint para obtener libros por el id de la categoría
/**
 * @openapi
 *  /books/{categoryId}:
 *    get:
 *      tags:
 *        - Books
 *      summary: Get books by category ID
 *      parameters:
 *        - name: categoryId
 *          in: path
 *          required: true
 *          schema:
 *            type: integer
 *            example: 1
 *          description: The ID of the category to search books by
 *      responses:
 *        200:
 *          description: Books retrieved successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  data:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Books'
 *                    example:
 *                      - title: Fisica para ingeniería
 *                        description: some description
 *                        edition: 10
 *                        year: 2017
 *                        publisher: publisher
 *                        language: esp
 *                        isbn: isbn3
 *                        amount: 15
 *        404:
 *          description: No books found for the given category ID
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: No books found for category ID: 1
 *        500:
 *          description: Server error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Error retrieving books
 */
book.get("/:categoryId", async (req: Request, res: Response) => {
  const { categoryId } = validateSchema(PartialGetCat, req.params, res) || {};

  if (categoryId === undefined) return;

  try {
    const booksIdList: any = await db
      .select({ bookId: categoriesPerBook.bookId })
      .from(categoriesPerBook)
      .where(eq(categoriesPerBook.categoryId, categoryId));

    const booksList: any = await db
      .select()
      .from(books)
      .where(inArray(books.bookId, booksIdList));

    return res.status(200).json({
      message: "success",
      data: booksList,
    });
  } catch (error) {
    handleError(res, error, "");
  }
});

// Crear endpoint para obtener libros por conjunto de ids de categorias
/**
 * @openapi
 *  /books/categories:
 *    post:
 *      tags:
 *        - Books
 *      summary: Get books by multiple category IDs
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                categories:
 *                  type: array
 *                  items:
 *                    type: integer
 *                  example: [1, 2, 3]
 *              required:
 *                - categories
 *              description: Array of category IDs to search for books
 *      responses:
 *        200:
 *          description: Books retrieved successfully
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: success
 *                  data:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Books'
 *                    example:
 *                      - title: Fisica para ingeniería
 *                        description: some description
 *                        edition: 10
 *                        year: 2017
 *                        publisher: publisher
 *                        language: esp
 *                        isbn: isbn3
 *                        amount: 15
 *        400:
 *          description: Invalid or missing categories array
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Se requiere un arreglo de categorías."
 *        404:
 *          description: No books found for the given category IDs
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Books not found.
 *                  data:
 *                    type: array
 *                    items:
 *                      type: string
 *                    example: []
 *        500:
 *          description: Server error
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: Error retrieving books
 */
book.post("/categories", async (req: Request, res: Response) => {
  const { categories } = req.body;

  if (!Array.isArray(categories) || categories.length === 0) {
    return res
      .status(400)
      .json({ message: "Se requiere un arreglo de categorías." });
  }

  categories.forEach((categoryId: any) => {
    validateSchema(PartialGetCat, categoryId, res);
  });

  if (categories === undefined) return;

  try {
    const booksIds = await db
      .select({ bookId: categoriesPerBook.bookId })
      .from(categoriesPerBook)
      .where(inArray(categoriesPerBook.categoryId, categories));

    if (booksIds.length === 0) {
      return res.status(200).json({ message: "Books not found.", data: [] });
    }

    // Filtrando los valores nulos y extraeyendo los IDs de los libros
    const bookIdList = booksIds
      .map((item: { bookId: number | null }) => item.bookId)
      .filter((id): id is number => id !== null);

    const booksList = await db
      .select()
      .from(books)
      .where(inArray(books.bookId, bookIdList));

    return res.status(200).json({
      message: "success",
      data: booksList,
    });
  } catch (error) {
    handleError(res, error, "");
  }
});

// Obteniendo información detallada de un libro
/**
 * @openapi
 * /bookdetail/{bookId}:
 *   get:
 *     tags:
 *       - Books
 *     summary: Retrieve details of a book including its reservation status
 *     parameters:
 *       - name: bookId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The ID of the book to retrieve details for
 *     responses:
 *       200:
 *         description: Book details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Book fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookId:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Sample Book Title"
 *                     description:
 *                       type: string
 *                       example: "A brief description of the book."
 *                     edition:
 *                       type: string
 *                       example: "First Edition"
 *                     year:
 *                       type: integer
 *                       example: 2024
 *                     publisher:
 *                       type: string
 *                       example: "Sample Publisher"
 *                     language:
 *                       type: string
 *                       example: "English"
 *                     isbn:
 *                       type: string
 *                       example: "978-3-16-148410-0"
 *                     authors:
 *                       type: string
 *                       example: "Author One, Author Two"
 *                     category:
 *                       type: string
 *                       example: "Fiction"
 *                     similarBooks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: integer
 *                             example: 2
 *                           isbn:
 *                             type: string
 *                             example: "978-1-23-456789-0"
 *                           title:
 *                             type: string
 *                             example: "Another Sample Book Title"
 *                           authors:
 *                             type: string
 *                             example: "Author Three, Author Four"
 *                     isReserved:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authorization token required"
 *       404:
 *         description: Book or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book not found" or "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error searching book"
 */
book.get("/bookdetail/:bookId", async (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
    // Extraer el token de autorización y verificarlo
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }
    
    // Verificar y decodificar el token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as any).userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Obtener el número de cuenta del usuario
    const user = await db
      .select({ numeroCuenta: users.numeroCuenta })
      .from(users)
      .where(eq(users.userId, userId));

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const numeroCuenta = user[0].numeroCuenta;

    // Obtener la información básica del libro
    const book = await db.select({
      bookId: books.bookId,
      title: books.title,
      description: books.description,
      edition: books.edition,
      year: books.year,
      publisher: books.publisher,
      language: books.language,
      isbn: books.isbn,
    })
    .from(books)
    .where(eq(books.bookId, bookId));

    if (book.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Verificar si el usuario ha reservado este libro
  const isReserved = await db
    .select({ count: sql<number>`count(*)` })
    .from(reserves)
    .innerJoin(users, eq(reserves.userId, users.userId)) // Relacionar con la tabla de usuarios
    .where(
      eq(reserves.bookId, bookId) &&
      (numeroCuenta ? eq(users.numeroCuenta, numeroCuenta) : sql`1 = 0`) // Si numeroCuenta es null, evita la comparación
    )
    .then((result) => result[0]?.count > 0); // Si hay al menos una reserva, isReserved es true


    // Obtener lista de autores del libro
    const authorsIdList: any = await db
      .select({ authorId: authorsPerBook.authorId })
      .from(authorsPerBook)
      .where(eq(authorsPerBook.bookId, bookId));

    const authorsList: Author[] = await db
      .select()
      .from(authors)
      .where(inArray(authors.authorId, authorsIdList));

    // Obtener la categoría del libro
    const category = await db
      .select({
        categoryId: categoriesPerBook.categoryId,
        name: categories.name
      })
      .from(categoriesPerBook)
      .innerJoin(categories, eq(categoriesPerBook.categoryId, categories.categoryId))
      .where(eq(categoriesPerBook.bookId, bookId))
      .limit(1);

    // Obtener libros similares
    const categoryId = category[0]?.categoryId;
    const similarBooksQuery = db
      .select({
        bookId: books.bookId,
        isbn: books.isbn,
        title: books.title,
      })
      .from(books)
      .innerJoin(categoriesPerBook, eq(books.bookId, categoriesPerBook.bookId))
      .innerJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .where(
        categoryId !== undefined && categoryId !== null
          ? eq(categoriesPerBook.categoryId, categoryId) ||
            inArray(authorsPerBook.authorId, authorsList.map((author) => author.authorId))
          : inArray(authorsPerBook.authorId, authorsList.map((author) => author.authorId))
      )
      .limit(13);

    const similarBooks = await similarBooksQuery;

    // Obtener autores para libros similares
    const similarBooksWithAuthors = await Promise.all(
      similarBooks.map(async (book) => {
        const similarBookAuthors: any = await db
          .select({ authorId: authorsPerBook.authorId })
          .from(authorsPerBook)
          .where(eq(authorsPerBook.bookId, book.bookId));

        const authorsForSimilarBook = await db
          .select()
          .from(authors)
          .where(inArray(authors.authorId, similarBookAuthors));

        return {
          ...book,
          authors: authorsForSimilarBook
            .map((author) => `${author.firstName} ${author.lastName}`)
            .join(", "),
        };
      })
    );

    res.status(200).json({
      message: "Book fetched successfully",
      data: {
        ...book[0],
        authors: authorsList.map((author) => `${author.firstName} ${author.lastName}`).join(", "),
        category: category[0]?.name || null,
        similarBooks: similarBooksWithAuthors,
        isReserved: isReserved, 
      }
    });
  } catch (error) {
    handleError(res, error, "Error searching book");
  }
});