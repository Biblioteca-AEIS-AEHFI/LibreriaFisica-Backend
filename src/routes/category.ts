import { Router, type Request, type Response } from "express";
import {
  type Category,
  type NewCategory,
  categories,
  CategorySchema,
  NewCategorySchema,
  categoriesPerBook,
} from "../db/schema";
import { db } from "../db/db";
import { eq, or, and } from "drizzle-orm";
import { saveChildren } from "../utils/categories";
import { categorySchema, type categoryFormat } from "../utils/definitions";

export const categoryRouter: Router = Router();

// get categories
/**
 *@openapi
 *  /categorias:
 *    get:
 *        tags:
 *          - Categorias
 *        summary: obtener todas las categorias existentes en DB
 *        responses:
 *          200:
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                  - message
 *                  - data
 *                  properties:
 *                    message:
 *                      type: string
 *                    data:
 *                      type: array
 *                      items:
 *                        type: object
 *                        $ref: #/components/schemas/Categories
 *                        example: {name: matematicas discretas, categoryId: 4, parentCategoryId: 1}
 *          5xx:
 *            description: FAILED
 *            content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - message
 *                properties:
 *                  message:
 *                    type: string
 *                    example: error while handling categories
 *
 * components:
 *   schemas:
 *    Categories:
 *      type: object
 *      required:
 *        - name
 *        - categoryId
 *        - parentCategoryId
 *      properties:
 *        name:
 *          type: string
 *          example: matematicas
 *        categoryId:
 *          type: number
 *          example: 4
 *        parentCategoryId:
 *          type: number
 *          example: 1
 *
 */
categoryRouter.get("/", async (req: Request, res: Response) => {
  try {
    const categoriesList: Array<Category> = await db.select().from(categories);
    return res.status(200).json({
      message: "categories handled successfully",
      data: categoriesList,
    });
  } catch (err) {
    return res.status(500).json({ message: "error while handling categories" });
  }
});

// ------------------------------------------------------------------------------------------------------
// begining of endpoints requested for frontend
// ------------------------------------------------------------------------------------------------------

/**
 *@openapi
 * /categorias/all:
 *    get:
 *        tags:
 *          - Categorias
 *        summary: obtener todas las categorias existentes en DB por orden jerarquico. Solo obtiene las categorias de primer orden(categorias sin padre) y recursivamente obtienen las categorias de forma jerarquica.
 *        responses:
 *          200:
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                    - message
 *                    - data
 *                  properties:
 *                    message:
 *                      type: string
 *                    data:
 *                      type: array
 *                      items:
 *                        type: object
 *                        example: {category_id: 1, name: matematicas, children: [{category_id: 2, name: matematicas discretas, children: []}]}
 *          5xx:
 *            description: FAILED
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                    - message
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: error while handling categories
 *
 */
categoryRouter.get("/all", async (req: Request, res: Response) => {
  try {
    const categoriesList: Array<Category> = await db
      .select()
      .from(categories)
      .orderBy(categories.categoryId);
    const result = [];
    // it gets every element/category in list/database
    for (let i = 0; i < categoriesList.length; i++) {
      // will return just parent (first order) categories
      if (categoriesList[i].parentCategoryId != null) continue;

      const obj: categoryFormat = {
        category_id: categoriesList[i].categoryId,
        name: categoriesList[i].name,
        icon: categoriesList[i].icon,
        children: saveChildren(categoriesList, categoriesList[i].categoryId),
      };

      result.push(obj);
    }
    res.status(200).json({
      message: "categories handled successfully",
      data: result,
    });
  } catch (e) {
    return { message: "error while getting categories" };
  }
});

/**
 *@openapi
 * /categorias/delete/{id}:
 *   get:
 *       tags:
 *        - Categorias
 *       summary: Elimina una categoría y todas sus categorías hijas (solo actualiza el campo enabled a false, el registro no se borra de la base de datos como tal).
 *       parameters:
 *        - name: id
 *          in: path
 *          description: ID de la categoría a eliminar
 *          required: true
 *          schema:
 *            type: integer
 *       responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - message
 *                  - state
 *                properties:
 *                  message:
 *                    type: string
 *                    example: category deleted successfully
 *                  state:
 *                    type: integer
 *                    example: 1
 *        5xx:
 *          description: FAILED
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - message
 *                  - state
 *                properties:
 *                  message:
 *                    type: string
 *                    example: category could not be deleted
 *                  state:
 *                    type: integer
 *                    example: 0
 */

categoryRouter.delete("/delete/:id", async (req: Request, res: Response) => {
  const categoryId = Number(req.params.id);
  //const token = req.cookies?.access_token;
  try {
    //if (token?.tipo != 1)
    // return res.status(401).json({ message: "access denied" });
    const booksWithCategoryToDelete = await db
      .select()
      .from(categoriesPerBook)
      .where(eq(categoriesPerBook.categoryId, categoryId));
    console.log(booksWithCategoryToDelete);
    // state = 0 indicates that category cant be removed
    // state = 1 indicates that category was deleted
    if (booksWithCategoryToDelete.length > 0)
      return res
        .status(500)
        .json({ message: "category can not be deleted", state: 0 });

    // children categories should be deleted as well
    const categoriesToBeDeleted: Array<Category> = await db
      .select()
      .from(categories)
      .where(
        or(
          eq(categories.categoryId, categoryId),
          eq(categories.parentCategoryId, categoryId)
        )
      );

    categoriesToBeDeleted.forEach(async (categoryToDelete) => {
      await db
        .update(categories)
        .set({ enabled: false })
        .where(eq(categories.categoryId, categoryToDelete.categoryId));
    });

    return res
      .status(200)
      .json({ message: "category deleted successfully", state: 1 });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "category could not be deleted", state: 0 });
  }
});

/**
 *@openapi
 * /categorias/update:
 *   put:
 *       tags:
 *        - Categorias
 *       summary: Actualiza una categoría utilizando el cuerpo de la solicitud.
 *       requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                categoryId:
 *                  type: integer
 *                  example: 1
 *                name:
 *                  type: string
 *                  example: matematicas
 *                parentCategoryId:
 *                  type: integer
 *                  nullable: true
 *                  example: null
 *                icon:
 *                  type: string
 *                  example: matematicas.svg
 *                enabled:
 *                  type: boolean
 *                  example: true
 *       responses:
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
 *                    example: category updated successfully
 *                  data:
 *                    type: object
 *                    properties:
 *                      categoryId:
 *                        type: integer
 *                        example: 1
 *                      name:
 *                        type: string
 *                        example: matematicas
 *                      parentCategoryId:
 *                        type: integer
 *                        nullable: true
 *                        example: null
 *                      icon:
 *                        type: string
 *                        example: matematicas.svg
 *                      enabled:
 *                        type: boolean
 *                        example: true
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
 *                    example: category could not be updated
 */

categoryRouter.put("/update", async (req: Request, res: Response) => {
  //const token = req.cookies?.access_token;
  try {
    //if (token?.tipo != 1)
    //  return res.status(401).json({ message: "access denied" });
    const categoryObj = req.body;
    const validCategory: boolean =
      NewCategorySchema.safeParse(categoryObj).success;
    if (!validCategory)
      return res
        .status(400)
        .json({ message: "Invalid category parameters", data: [] });

    await db
      .update(categories)
      .set({
        name: categoryObj.name,
        icon: categoryObj.icon,
        parentCategoryId: categoryObj.parentCategoryId,
      })
      .where(and(eq(categories.categoryId, categoryObj.categoryId), eq(categories.enabled, true)));
    const categoryUpdated: Category = (
      await db
        .select()
        .from(categories)
        .where(eq(categories.categoryId, categoryObj.categoryId))
    )[0];
    return res
      .status(200)
      .json({
        message: "category updated successfully",
        data: categoryUpdated,
      });
  } catch (err) {
    return res.status(500).json({ message: "could not update category" });
  }
});

// ------------------------------------------------------------------------------------------------------
// end of endpoints requested for frontend
// ------------------------------------------------------------------------------------------------------

// get category by id
/**
 * @openapi
 * '/categories/{id}':
 *  get:
 *      tags:
 *        - Categorias
 *      summary: get category by id
 *      parameters:
 *        - name: id
 *          in: path
 *          description: category id
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
 *                    type: object
 *                    example: { name: matematicas discretas, categoryId: 4, parentCategoryId: 1 }
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
 *                    example: error while handling categories with id
 *
 */
categoryRouter.get("/:id", async (req: Request, res: Response) => {
  const numberRegex = /^\d+$/;
  const id: string = req.params.id;
  if (!numberRegex.test(id))
    return res
      .status(404)
      .json({ message: "error while handling categories by id" });
  try {
    const category: Category = (
      await db
        .select()
        .from(categories)
        .where(eq(categories.categoryId, Number(id)))
    )[0];
    if (!category)
      return res.status(404).json({ message: "category not found", data: [] });

    return res.status(200).json({
      message: "category found successfully",
      data: category,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "error while handling categories with id" });
  }
});

// get category by name
/**
 * @openapi
 * '/categories/especialidad/{name}':
 *  get:
 *      tags:
 *        - Categorias
 *      summary: get category by name
 *      parameters:
 *        - name: name
 *          in: path
 *          description: category name
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
 *                    type: object
 *                    example: { name: matematicas discretas, categoryId: 4, parentCategoryId: 1 }
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
 *                    example: error while handling categories with id
 *
 */
categoryRouter.get(
  "/especialidad/:name",
  async (req: Request, res: Response) => {
    const categoryName: string = req.params.name;
    try {
      const category: Category = (
        await db
          .select()
          .from(categories)
          .where(eq(categories.name, categoryName))
      )[0];
      if (!category)
        return res
          .status(404)
          .json({ message: "category not found", data: [] });

      return res.status(200).json({
        message: "category found successfully",
        data: category,
      });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ message: "error while handling categories" });
    }
  }
);

// create a category
/**
 * @openapi
 * /categories/create:
 *  post:
 *       tags:
 *          - Categorias
 *       summary: create new category
 *       requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - name
 *                - parentCategoryId
 *                - icon
 *              properties:
 *                name:
 *                  type: string
 *                  example: ecuaciones diferenciales
 *                parentCategoryId:
 *                  type: number
 *                  example: 1
 *                icon:
 *                  type: string
 *                  example: ecuacionesDiferenciales.svg
 * 
 *       responses:
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
 *                    example: category created successfully
 *                  data:
 *                    type: object
 *                    example: { name: ecuaciones diferenciales, categoryId: 6, parentCategoryId: 1, icon: ecuacionesDiferenciales.svg, enabled: true }
 * 
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
 *                    example: error while handling category
 */
categoryRouter.post("/create", async (req: Request, res: Response) => {
  try {
    const validCategory: boolean = categorySchema.safeParse(
      req.body
    ).success;
    if (!validCategory)
      return res
        .status(400)
        .json({ message: "Invalid category parameters", data: [] });

    const returningId: number = (
      await db.insert(categories).values({ name: req.body.name, parentCategoryId: req.body.parentCategoryId, icon: req.body.icon, enabled: true }).$returningId()
    )[0].categoryId;
    const categoryCreated = await db
      .select()
      .from(categories)
      .where(eq(categories.categoryId, returningId));

    return res.status(200).json({
      message: "category created successfully",
      data: categoryCreated,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "error while handling category" });
  }
});

// delete a category by id
/**
 * @openapi
 * '/categories/{id}':
 *  delete:
 *         tags:
 *          - Categorias
 *         summary: delete category by id
 *         parameters:
 *          - name: id
 *            in: path
 *            description: category id
 *            required: true
 *         responses:
 *          200:
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                    - message
 *                    - data
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: category deleted successfully
 *                    data:
 *                      type: object
 *                      example: { name: matematicas discretas, categoryId: 4, parentCategoryId: 1 }
 *
 *          5xx:
 *            description: FAILED
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                    - message
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: error while trying to delete category
 *
 */
categoryRouter.delete("/:id", async (req: Request, res: Response) => {
  const numberRegex = /^\d+$/;
  const id: string = req.params.id;
  if (!numberRegex.test(id))
    return res.status(400).json({ message: "invalid parameters" });

  try {
    const categoryToDelete: Category = (
      await db
        .select()
        .from(categories)
        .where(eq(categories.categoryId, Number(id)))
    )[0];
    if (!categoryToDelete)
      return res.status(400).json({ message: "invalid parameters" });

    await db.delete(categories).where(eq(categories.categoryId, Number(id)));

    return res.status(200).json({
      message: "category deleted successfully",
      data: categoryToDelete,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "error while trying to delete category" });
  }
});

// delete category by name
/**
 * @openapi
 * '/categories/especialidad/{name}':
 *  delete:
 *         tags:
 *          - Categorias
 *         summary: delete category by name
 *         parameters:
 *          - name: name
 *            in: path
 *            description: category name
 *            required: true
 *         responses:
 *          200:
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                    - message
 *                    - data
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: category deleted successfully
 *                    data:
 *                      type: object
 *                      example: { name: matematicas discretas, categoryId: 4, parentCategoryId: 1 }
 *
 *          5xx:
 *            description: FAILED
 *            content:
 *              application/json:
 *                schema:
 *                  type: object
 *                  required:
 *                    - message
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: error while deleting category
 *
 */
categoryRouter.delete(
  "/categoria/:name",
  async (req: Request, res: Response) => {
    const name: string = req.params.name;
    try {
      const categoryToDelete: Category = (
        await db.select().from(categories).where(eq(categories.name, name))
      )[0];
      if (!categoryToDelete)
        return res.status(400).json({ message: "invalid paramaters" });
      await db.delete(categories).where(eq(categories.name, name));
      return res.status(200).json({
        message: "category deleted successfully",
        data: categoryToDelete,
      });
    } catch (err) {
      return res.status(500).json({ message: "error while deleting category" });
    }
  }
);
