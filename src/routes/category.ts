import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { categories, type Category } from "../db/schema/categories";
import { eq, isNull } from "drizzle-orm";
import { getBooksByCategory } from "./book";

export const categoriesRouter = Router();

categoriesRouter.get("/parents", async (req: Request, res: Response) => {
  const parentCategories: Category[] = await db
    .select()
    .from(categories)
    .where(isNull(categories.parentCategoryId));

  if (parentCategories.length > 0)
    return res.status(200).json(parentCategories);

  return res.status(500).json({ e: "No parent categories found" });
});

categoriesRouter.get(
  "/children/:parentCategoryId",
  async (req: Request, res: Response) => {
    const parentCategoryId = parseInt(req.params.parentCategoryId);

    // Fetch children categories and books corresponding to the parent category specified
    const categoryBooks = await getBooksByCategory(parentCategoryId);
    const childrenCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.parentCategoryId, parentCategoryId));

    return res.status(200).json({
      books: categoryBooks,
      childrenCategories: childrenCategories,
    });
  }
);
