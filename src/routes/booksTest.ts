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

// Simular la base de datos en memoria
let booksList: any[] = [];
let currentId = 1;
  
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
book.get("/", (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      message: "Books fetched successfully",
      data: booksList,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching books');
  }
});

// Obteniendo un libro
book.get("/:bookId", (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
    const book = booksList.find(a => a.bookId === bookId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      message: "Book fetched successfully",
      data: book,
    });
  } catch (error) {
    handleError(res, error, 'Error searching book');
  }
});

// Creando un libro
book.post("/create", (req: Request, res: Response) => {
  const bookData = validateSchema(NewBookSchema, req.body, res) as any | null;
  if (!bookData) return;

  try {
    bookData.bookId = currentId++;
    booksList.push(bookData);

    return res.status(201).json({
      message: "Book created successfully",
      data: bookData,
    });
  } catch (error) {
    handleError(res, error, 'Error creating Book');
  }
});

// Actualizando datos de libro
book.patch("/update/:bookId", (req: Request, res: Response) => {
  const bookData = validateSchema(UpdateBookSchema, req.body, res) as any | null;
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (!bookData || bookId === undefined) return;

  try {
    const bookIndex = booksList.findIndex(a => a.bookId === bookId);

    if (bookIndex === -1) {
      return res.status(404).json({ message: "Book not found" });
    }

    booksList[bookIndex] = { ...booksList[bookIndex], ...bookData };

    return res.status(200).json({
      message: `Book with id: ${bookId} updated successfully`,
    });
  } catch (error) {
    handleError(res, error, 'Error updating Book');
  }
});

// Borrando libro
book.delete("/delete/:bookId", (req: Request, res: Response) => {
  const { bookId } = validateSchema(idBookSchema, req.params, res) || {};
  if (bookId === undefined) return;

  try {
    const bookIndex = booksList.findIndex(a => a.bookId === bookId);

    if (bookIndex === -1) {
      return res.status(404).json({ message: "Book not found" });
    }

    booksList.splice(bookIndex, 1);

    return res.status(200).json({
      message: `Book with id: ${bookId} deleted successfully`,
    });
  } catch (error) {
    handleError(res, error, 'Error deleting book');
  }
});
