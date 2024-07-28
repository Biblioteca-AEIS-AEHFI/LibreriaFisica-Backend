import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import {
  authors,
  AuthorSchema,
  NewAuthorSchema,
  UpdateAuthorSchema,
  type Author,
  type NewAuthor,
} from "../db/schema";

export const author: Router = Router();

// Simular la base de datos en memoria
let authorsList: any[] = [];
let currentId = 1;
  
const idAuthorSchema = z.object({
    authorId: z.string().regex(/^\d+$/).transform(Number),
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

// Obteniendo todos los autores
author.get("/", (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      message: "Authors fetched successfully",
      data: authorsList,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching authors');
  }
});

// Obteniendo un autor
author.get("/:authorId", (req: Request, res: Response) => {
  const { authorId } = validateSchema(idAuthorSchema, req.params, res) || {};
  if (authorId === undefined) return;

  try {
    const author = authorsList.find(a => a.authorId === authorId);

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.status(200).json({
      message: "Author fetched successfully",
      data: author,
    });
  } catch (error) {
    handleError(res, error, 'Error searching author');
  }
});

// Creando un autor
author.post("/create", (req: Request, res: Response) => {
  const authorData = validateSchema(NewAuthorSchema, req.body, res) as any | null;
  if (!authorData) return;

  try {
    authorData.authorId = currentId++;
    authorsList.push(authorData);

    return res.status(201).json({
      message: "Author created successfully",
      data: authorData,
    });
  } catch (error) {
    handleError(res, error, 'Error creating author');
  }
});

// Actualizando datos de autor
author.patch("/update/:authorId", (req: Request, res: Response) => {
  const authorData = validateSchema(UpdateAuthorSchema, req.body, res) as any | null;
  const { authorId } = validateSchema(idAuthorSchema, req.params, res) || {};
  if (!authorData || authorId === undefined) return;

  try {
    const authorIndex = authorsList.findIndex(a => a.authorId === authorId);

    if (authorIndex === -1) {
      return res.status(404).json({ message: "Author not found" });
    }

    authorsList[authorIndex] = { ...authorsList[authorIndex], ...authorData };

    return res.status(200).json({
      message: `Author with id: ${authorId} updated successfully`,
    });
  } catch (error) {
    handleError(res, error, 'Error updating Author');
  }
});

// Borrando autor
author.delete("/delete/:authorId", (req: Request, res: Response) => {
  const { authorId } = validateSchema(idAuthorSchema, req.params, res) || {};
  if (authorId === undefined) return;

  try {
    const authorIndex = authorsList.findIndex(a => a.authorId === authorId);

    if (authorIndex === -1) {
      return res.status(404).json({ message: "Author not found" });
    }

    authorsList.splice(authorIndex, 1);

    return res.status(200).json({
      message: `Author with id: ${authorId} deleted successfully`,
    });
  } catch (error) {
    handleError(res, error, 'Error deleting author');
  }
});
