import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { categories, type Category } from "../db/schema/categories";
import { eq, isNull } from "drizzle-orm";
import { getBooksByCategory } from "./book";
import { number } from "zod";

export const categoriesRouter = Router();

/**
 *
 *@openapi
 * /category/parents:
 *  get:
 *    tags:
 *      - Cateogories
 *    summary: get parent categories
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: Category[]
 *                  properties:
 *                    categoryId:
 *                      type: number
 *                    parentCategoryId:
 *                      type: number | null
 *                    name:
 *                      type: string
 *      500:
 *        description: FAILED
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - message
 *              properties:
 *                message:
 *                  type: string
 */

categoriesRouter.get("/parents", async (req: Request, res: Response) => {
  const parentCategories: Category[] = await db
    .select()
    .from(categories)
    .where(isNull(categories.parentCategoryId));

  if (parentCategories.length > 0)
    return res.status(200).json(parentCategories);

  return res.status(500).json({ e: "No parent categories found" });
});

/**
 *
 *@openapi
 * /category/children/{parentCategoryId}:
 *  get:
 *    tags:
 *      - Cateogories
 *    summary: get children categories and books associated to a parent category
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                books:
 *                  type: Book[]
 *                  properties:
 *                    bookId:
 *                      type: number
 *                    title:
 *                      type: string
 *                    description:
 *                      type: string
 *                    edition:
 *                       type: number
 *                    year:
 *                        type: number
 *                    publisher:
 *                        type: string
 *                    language:
 *                      type: string
 *                    isbn:
 *                      type: string
 *                    amount:
 *                      type: number
 *                childrenCategories:
 *                  type: Category[]
 *                  properties:
 *                    categoryId:
 *                      type: number
 *                    parentCategoryId:
 *                      type: number
 *                    name:
 *                      type: string
 *      404:
 *        description: Parent Category not found
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - message
 *              properties:
 *                message:
 *                  type: string
 *
 *      500:
 *        description: FAILED
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - message
 *              properties:
 *                message:
 *                  type: string
 */

categoriesRouter.get(
  "/children/:parentCategoryId",
  async (req: Request, res: Response) => {
    const parentCategoryId = parseInt(req.params.parentCategoryId);

    // Verify for category existance
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.categoryId, parentCategoryId));

    if (!result[0]) {
      return res.status(404).json({ e: "Parent Category does not exist" });
    }

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
