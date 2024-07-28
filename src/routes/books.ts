import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import {
  books,
  BookSchema,
  NewBookSchema,
  UpdateBookSchema,
  type Book,
  type NewBook,
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

// Creando un libro
book.post("/create", async (req: Request, res: Response) => {
  const bookData = validateSchema(NewBookSchema, req.body, res) as any | null;
  if (!bookData) return;

  try {
    const result = await db.insert(books).values(bookData);
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
      await db.update(books).set({
        title: bookData.title,
        description: bookData.description,
        edition: bookData.edition,
        year: bookData.year,
        publisher: bookData.publisher,
        language: bookData.language,
        isbn: bookData.isbn,
        amount: bookData.amount,
      }).where(eq(books.bookId, bookId))

      res.status(200).json({
        message: `Book with id: ${bookId} updated successfully`
      });
    } catch (error) {
        handleError(res, error, 'Error updating book');
    }
  } catch (error) {
    handleError(res, error, "Error searching for book to update");
  }
});

// Borrando libro
book.delete("/delete/:bookId", async (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
    const checkBookQuery = await db
      .select()
      .from(books)
      .where(eq(books.bookId, bookId));

    if (checkBookQuery.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    try{
        await db.delete(books).where(eq(books.bookId, bookId));

        res.status(200).json({
            message: `Book with id: ${bookId} deleted successfully`
        });
    }catch(error){
        handleError(res, error, 'Error deleting book')
    }
  } catch (error) {
    handleError(res, error, "Error searching for book to delete");
  }
});
