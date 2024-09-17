import { Router, type Request, type Response } from "express";
import { eq, or } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import {
  authors,
  AuthorSchema,
  NewAuthorSchema,
  PartialGetAuthor,
  UpdateAuthorSchema,
  type Author,
  type NewAuthor,
} from "../db/schema";

export const author: Router = Router();

// Para validación de ID
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
author.get("/", async (req: Request, res: Response) => {
  try {
    const result: Author[] = await db.select().from(authors);
    return res.status(200).json({
      message: "Authors fetched successfully",
      data: result,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching authors')
  }
});

// Obteniendo un autor
author.get("/:authorId", async (req: Request, res: Response) => {
    const {authorId} = validateSchema(idAuthorSchema, req.params, res) || {}
    if (authorId === undefined) return;

  try {
    const author = await db
      .select()
      .from(authors)
      .where(eq(authors.authorId, authorId));

    if (author.length === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.status(200).json({
      message: "Author fetched successfully",
      data: author[0],
    });
  } catch (error) {
    handleError(res, error, 'Error searching author')
  }
});

// Obteniendo autor por nombre
author.get("/:authorName", async (req: Request, res: Response) => {
  let {authorName} = validateSchema(PartialGetAuthor, req.params, res) || {}
  authorName = authorName.trim()
  
  if (authorName === undefined) return;

try {
  const author = await db
    .select()
    .from(authors)
    .where(or(
      eq(authors.firstName, authorName), eq(authors.lastName, authorName)
    ));

  if (author.length === 0) {
    return res.status(404).json({ message: "Author not found" });
  }

  res.status(200).json({
    message: "Author fetched successfully",
    data: author[0],
  });
} catch (error) {
  handleError(res, error, 'Error searching author')
}
});

// Creando un autor
author.post("/create", async (req: Request, res: Response) => {
    const authorData = validateSchema(NewAuthorSchema, req.body, res) as NewAuthor | null;
    if (!authorData) return;

  try {
    const result = await db.insert(authors).values(authorData);
    return res.status(201).json({
      message: "Author created successfully",
      data: result,
    });
  } catch (error) {
    handleError(res, error, 'Error creating author')
  }
});

// Actualizando datos de autor
author.patch("/update/:authorId", async (req: Request, res: Response) => {
    const authorData = validateSchema(UpdateAuthorSchema, req.body, res) as Author | null;
    const {authorId} = validateSchema(idAuthorSchema, req.params, res) || {}
if(!authorData || authorId === undefined) return;

  try {
    const checkAuthorQuery = await db
      .select()
      .from(authors)
      .where(eq(authors.authorId, authorId));

    if (checkAuthorQuery.length === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    try {

      await db
        .update(authors)
        .set({ firstName: authorData.firstName, lastName: authorData.lastName })
        .where(eq(authors.authorId, authorId));

      return res.status(200).json({
        message: `Author with id: ${authorId} updated successfully`,
      });
    } catch (error) {
      handleError(res, error, 'Error updating Author')
    }
  } catch (error) {
    handleError(res, error, 'Error searching for author to update')
  }
});

// Borrando autor
author.delete("/delete/:authorId", async (req: Request, res: Response) => {
  const {authorId} = validateSchema(idAuthorSchema, req.params, res) || {}
  if (authorId === undefined) return;

  try {
    const checkAuthorQuery = await db
      .select()
      .from(authors)
      .where(eq(authors.authorId, authorId));

    if (checkAuthorQuery.length === 0) {
      return res.status(404).json({ message: "Author not found" });
    }

    try {
      await db.delete(authors).where(eq(authors.authorId, authorId));

      return res.status(200).json({
        message: `Author with id: ${authorId} deleted successfully`,
      });
    } catch (error) {
      handleError(res, error, 'Error deleting author')
    }
  } catch (error) {
    handleError(res, error, 'Error searching for author to delete')
  }
});