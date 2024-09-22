import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema/users";
import { getCheckoutDateNum, getStudenLoans } from "../utils/loans";
import { UserHome } from "../utils/UserHome";
import { getToken } from "../utils/tokenInfo";

export const loansRouter: Router = Router();

/**
 *@openapi
 * /prestamos/estudiantes:
 *  get:
 *    tags:
 *      - Prestamos
 *    summary: Responde con un arreglo sobre los prestamos, libros populares, libros mas reservados por usuario, libros reservados por usuarios, libros con categorias mas solicitados etc, de un estudiante
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
 *                        example: { userName: carlos, loans: [{ idLoan: "1", returnDate: "10/07/1999", porcentLoan: "55", currentBook: { idBook: "1", isbn: "978-8499082479", bookName: "El nombre del viento", authors: "Patrick Rothfus" }}], recommended: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], popularBooks: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], newBooks: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}], categoryMostRequested: [{bookId: 1, isbn: 978-3-16-148410-0, title: matematicas, authors: autor1}] }
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
loansRouter.get("/estudiantes", async (req: Request, res: Response) => {
    const token: any = getToken(req)
    const studentId = token?.numeroCuenta;
    try {
      const studentName = token.firstName
      const loans = await getStudenLoans(studentId);
      const recommended = await UserHome.getRecommendedBooksByMostUserLoans(studentId);
      const popularBooks = await UserHome.getPopularBooks();
      const newBooks = await UserHome.getLastAdded();
      const categoryMostRequested = await UserHome.getRecommendedBooksByMostUsersLoans();

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
      console.log(err)
      return res
        .status(500)
        .json({ message: "could not get loans information " });
    }
  }
);


