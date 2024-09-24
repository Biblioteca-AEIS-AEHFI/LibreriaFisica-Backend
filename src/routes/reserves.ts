import { or, and, eq, inArray } from "drizzle-orm";
import type { Request, Response } from "express";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/db";
import { books, type Book } from "../db/schema/books";
import { loans, type Loan } from "../db/schema/loans";
import { reserves, type Reserve } from "../db/schema/reserves";
import { users } from "../db/schema/users";
import { getToken } from "../utils/tokenInfo";
import { authorsPerBook } from "../db/schema/authorsPerBooks";
import { authors } from "../db/schema/authors";
import { promise } from "zod";

// Date responses formatting options
const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const reservesRouter: Router = Router();
// make a loan

// Manejando errores
const handleError = (res: Response, error: unknown, message: string) => {
  return res.status(500).json({
    message,
    error,
  });
};

reservesRouter.post("/", async (req: Request, res: Response) => {
  const loanObj: number = req.body?.idBook;
  if (!loanObj)
    return res.status(400).json({ meesage: "Request body could not be read" });
  try {
    const token: any = getToken(req);
    const userNumeroCuenta: string = token?.numeroCuenta;

    // set checkoutDate to be next day to current day
    // fridays and saturdays in the Date js object correspond to 5 and 6 respectively

    // consider this code to set checkout date, but this should apply only when the loan is accepted.
    /* const currentDate = new Date()
    const checkoutDate = new Date(currentDate)
    const checkoutDay = getCheckoutDateNum(currentDate.getDay())
    checkoutDate.setDate(currentDate.getDate() + checkoutDay) */

    // get student who make the reserve
    // students with the worst type of reputation are not able to make loans
    const student = await db
      .select()
      .from(users)
      .where(eq(users.numeroCuenta, userNumeroCuenta));
  } catch (error) {
    res.status(500).json({ message: "Could not make loan", outCode: false });
  }
});

/**
 * @openapi
 * /history:
 *   get:
 *     summary: Obtener historial de préstamos del usuario
 *     description: Este endpoint retorna un historial de préstamos realizados por el usuario, agrupados por mes.
 *     responses:
 *       200:
 *         description: Historial de préstamos exitosamente recuperado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     months:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           monthName:
 *                             type: string
 *                             example: "Enero 2024"
 *                           loansOnMonth:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 idLoan:
 *                                   type: string
 *                                   example: "1"
 *                                 idBook:
 *                                   type: string
 *                                   example: "1"
 *                                 isbn:
 *                                   type: string
 *                                   example: "978-8491990437"
 *                                 title:
 *                                   type: string
 *                                   example: "Breves respuestas a grandes preguntas"
 *                                 authors:
 *                                   type: string
 *                                   example: "Patrick Rothfus"
 *                                 checkoutDate:
 *                                   type: string
 *                                   example: "7 mayo 2024"
 *                                 returnDate:
 *                                   type: string
 *                                   example: "7 mayo 2024"
 *                                 wasOnTime:
 *                                   type: boolean
 *                                   example: true
 *       401:
 *         description: Token de autorización requerido o inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Se requiere un token de autorización"
 *       404:
 *         description: No se encontraron reservas válidas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No se encontraron reservas válidas."
 *       500:
 *         description: Error interno al obtener el historial de préstamos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al obtener el historial de préstamos"
 */
reservesRouter.get("/history", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Se requiere un token de autorización" });
  }

  let userId: number;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    userId = (decodedToken as any).userId;
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }

  try {
    // Obtener reservas del usuario
    const reservesList: any = await db
      .select()
      .from(reserves)
      .where(eq(reserves.userId, userId));

    // Filtrar y extraer los reserveId
    const reserveIds: number[] = reservesList
      .map((r: any) => r.reserveId)
      .filter((id: any) => id !== null) as number[];

    // Comprobar si hay reservas válidas
    if (reserveIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron reservas válidas." });
    }

    // Obtener préstamos relacionados con las reservas
    const loansList: any = await db
      .select()
      .from(loans)
      .where(inArray(loans.reserveId, reserveIds));

    // Agrupar préstamos por mes
    const groupedLoans: { [key: string]: any[] } = {};
    for (const loan of loansList) {
      const reserveDetails: any = await db
        .select()
        .from(reserves)
        .where(eq(reserves.reserveId, loan.reserveId))
        .innerJoin(books, eq(reserves.bookId, books.bookId));

      const monthName = new Date(loan.loanedAt).toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
      });

      if (!groupedLoans[monthName]) {
        groupedLoans[monthName] = [];
      }

      groupedLoans[monthName].push({
        idLoan: loan.loanId,
        idBook: reserveDetails[0]?.bookId,
        isbn: reserveDetails[0]?.isbn,
        title: reserveDetails[0]?.title,
        authors: reserveDetails[0]?.authors.join(", "),
        checkoutDate: loan.loanedAt.toLocaleDateString("es-ES"),
        returnDate: loan.expiresOn.toLocaleDateString("es-ES"),
        wasOnTime:
          loan.state === "returned" && new Date(loan.expiresOn) >= new Date(),
      });
    }

    // Convertir el objeto en un arreglo
    const response = {
      months: Object.keys(groupedLoans).map((monthName) => ({
        monthName,
        loansOnMonth: groupedLoans[monthName],
      })),
    };

    return res.status(200).json({
      data: response,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al obtener el historial de préstamos", error });
  }
});

// Get loans and reserves associated to an account

reservesRouter.get("/pending", async (req: Request, res: Response) => {
  // Get account number from the session cookie
  const token = getToken(req);
  if (!token)
    return res.status(400).json({ e: "Session token not present or valid." });

  const userId = parseInt(token.numeroCuenta);

  // Lookup data for reserves
  const queryResults = await db
    .select()
    .from(reserves)
    .innerJoin(books, eq(reserves.bookId, books.bookId))
    .innerJoin(loans, eq(reserves.reserveId, loans.reserveId))
    .where(
      or(
        and(eq(reserves.userId, userId), eq(reserves.status, "pendiente")),
        eq(loans.state, "activo")
      )
    );

  const reserveIds: number[] = queryResults.map(
    ({ reserves }) => reserves.reserveId
  );

  const reservesData = await Promise.all(
    queryResults.map(async (value) => {
      // Deconstruct response
      const reserveDetails = value.reserves;
      const bookDetails = value.books;

      // Fetch author names
      const authorsResult = await db
        .select()
        .from(authors)
        .innerJoin(
          authorsPerBook,
          eq(authors.authorId, authorsPerBook.authorId)
        )
        .where(eq(authorsPerBook.bookId, bookDetails.bookId));

      const authorsNames: string[] = authorsResult.map(
        ({ authors }) => `${authors.firstName} ${authors.lastName}`
      );

      // Format createdAt date

      const createdAt =
        reserveDetails.status === "vencida"
          ? "vencida"
          : reserveDetails.createdAt.toLocaleDateString("es-HN", dateOptions);

      // Construct response object
      return {
        reserveId: reserveDetails.reserveId,
        bookId: bookDetails.bookId,
        isbn: bookDetails.isbn,
        title: bookDetails.title,
        authors: authorsNames,
        createdAt: createdAt,
      };
    })
  );

  const loansData = await Promise.all(
    queryResults.map(async (value) => {
      const loanDetails: Loan = value.loans;
      const bookDetails: Book = value.books;

      // Fetch author names
      const authorsResult = await db
        .select()
        .from(authors)
        .innerJoin(
          authorsPerBook,
          eq(authors.authorId, authorsPerBook.authorId)
        )
        .where(eq(authorsPerBook.bookId, bookDetails.bookId));

      const authorsNames: string[] = authorsResult.map(
        ({ authors }) => `${authors.firstName} ${authors.lastName}`
      );

      const expiresOn = loanDetails.expiresOn.toLocaleDateString(
        "es-HN",
        dateOptions
      );

      return {
        loanId: loanDetails.loanId,
        bookId: bookDetails.bookId,
        title: bookDetails.title,
        authors: authorsNames,
        expiresOn: expiresOn,
        expired: loanDetails.expiresOn < new Date(),
      };
    })
  );

  // Construct the response
  const result = {
    reserves: reservesData,
    loans: loansData,
  };

  return res.status(200).json(result);
});

export default reservesRouter;
