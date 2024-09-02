import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { and, eq } from "drizzle-orm";
import {
  authors,
  authorsPerBook,
  books,
  copies,
  loans,
  reserves,
  users,
} from "../db/schema";
import { formatAuthorsNames } from "../utils/autoresFormat";
import { getStudenLoans } from "../utils/loans";
import { UserHome } from "../utils/UserHome";

export const loansRouter: Router = Router();

/**
 *@openapi
 *'/prestamos/estudiantes/{numeroCuenta}':
 *  get:
 *    tags:
 *      - Prestamos
 *    summary: Responde con un arreglo sobre los prestamos, libros populares, libros mas reservados por usuario, libros reservados por usuarios, libros con categorias mas solicitados etc, de un estudiante
 *    parameters:
 *      - name: numeroCuenta
 *        in: path
 *        description: numeroCuenta del estudiante
 *        required: true
 *    responses:
 *        200:
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
 *                      example: successful
 *                    data:
 *                      type: array
 *                      items:
 *                        type: object
 *                        example: { userName: carlos, loans: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], recommended: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], popularBooks: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], newBooks: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], categoryMostRequested: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}] }
 *        5xx:
 *          description: FAILED
 *          content:
 *           application/json:
 *              schema:
 *                type: object
 *                required:
 *                  - message
 *                properties:
 *                  message:
 *                    type: string
 *                    example: could not get loans information
 */
loansRouter.get("/estudiantes/:NCuenta", async (req: Request, res: Response) => {
    const studentId = req.params.NCuenta;
    try {
      const studentName: string = (await db.select().from(users).where(eq(users.numeroCuenta, studentId)))[0].firstName;
      const loans = await getStudenLoans(studentId);
      const recommended = await UserHome.getRecommendedBooksByMostUserLoans(studentId);
      const popularBooks = await UserHome.getPopularBooks();
      const newBooks = await UserHome.getLastAdded();
      const categoryMostRequested =await UserHome.getRecommendedBooksByMostUsersLoans();

      const homeInfo = {
        userName: studentName,
        loans,
        recommended,
        popularBooks,
        newBooks,
        categoryMostRequested,
      };
      return res
        .status(200)
        .json({ message: "data handled successfully", data: homeInfo });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "could not get loans information " });
    }
  }
);
