import { Router, type Request, type Response } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import {
  books,
  copies,
  reserves,
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
          amount: bookData.amount,
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
        .where(inArray(
          reserves.copyId, 
          trx.select({ 
            copyId: copies.copyId 
          })
          .from(copies)
          .where(eq(copies.bookId, bookId))));

      // Eliminar préstamos relacionados
      await trx
        .delete(loans)
        .where(inArray(
          loans.reserveId, 
          trx.select({
            reserveId: reserves.reserveId 
          })
          .from(reserves)
          .where(inArray(
            reserves.copyId,
            trx.select({
              copyId: copies.copyId 
            })
            .from(copies)
            .where(eq(copies.bookId, bookId))))));

      // Eliminar copias relacionadas
      await trx
        .delete(copies)
        .where(eq(copies.bookId, bookId));

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
book.get("/bookdetail/:bookId", async (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
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

    // Contar la cantidad de copias disponibles (state = true)
    const availableCopiesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(copies)
      .where(
        eq(copies.bookId, bookId) &&
        eq(copies.state, true) // Disponibilidad de las copias
      )
      .then((result) => result[0]?.count || 0);

    // Contar la cantidad de copias prestadas (ejemplo: `state` podría ser "prestado" o `loans` asociados a las copias)
    const borrowedCopiesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .innerJoin(reserves, eq(loans.reserveId, reserves.reserveId))
      .innerJoin(copies, eq(reserves.copyId, copies.copyId))
      .where(eq(copies.bookId, bookId))
      .then((result) => result[0]?.count || 0);

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
      .limit(1); // Obtiene solo la primera categoría

    // Obtén el ID de la categoría si existe
    const categoryId = category[0]?.categoryId;

    // Construye la consulta para obtener libros similares
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
          ?
              eq(categoriesPerBook.categoryId, categoryId) // Libros de la misma categoría
              ||
              inArray(authorsPerBook.authorId, authorsList.map(author => author.authorId)) // Libros del mismo autor
            
          : inArray(authorsPerBook.authorId, authorsList.map(author => author.authorId)) // Solo por autor si no hay categoría
      )
      .limit(13); // Limita los resultados a 13

    const similarBooks = await similarBooksQuery;

    // Obtener autores para libros similares
    const similarBooksWithAuthors = await Promise.all(similarBooks.map(async (book) => {
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
        authors: authorsForSimilarBook.map(author => `${author.firstName} ${author.lastName}`).join(', ')
      };
    }));

    res.status(200).json({
      message: "Book fetched successfully",
      data: {
        ...book[0],
        booksAvailable: availableCopiesCount,
        borrowedBooks: borrowedCopiesCount,
        authors: authorsList.map(author => `${author.firstName} ${author.lastName}`).join(', '),
        category: category[0]?.name || null, // Agrega la categoría
        similarBooks: similarBooksWithAuthors // Libros similares con autores
      }
    });
  } catch (error) {
    handleError(res, error, "Error searching book");
  }
});
