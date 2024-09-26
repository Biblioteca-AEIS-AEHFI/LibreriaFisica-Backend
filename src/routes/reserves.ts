import type { Request, Response } from "express";
import { Router } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db";
import { users } from "../db/schema/users";
import { getToken } from "../utils/tokenInfo";
import { getCheckoutDateNum } from "../utils/loans";
import jwt from "jsonwebtoken";
import { loans, type Loan } from "../db/schema/loans";
import { reserves } from "../db/schema/reserves";
import { books } from "../db/schema/books";
import { userTypes } from "../db/schema/userTypes";

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

// Servicio para realizar reserva de un libro
/**
 * @openapi
 * /reserve:
 *   post:
 *     summary: Realiza una reserva de un libro para un usuario.
 *     description: Este servicio permite que un usuario realice la reserva de un libro si hay unidades disponibles y el usuario tiene la reputación adecuada.
 *     tags:
 *       - Reservas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idBook:
 *                 type: integer
 *                 description: Código del libro a reservar.
 *                 example: 123
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 description: Fecha en la que se planea recoger el libro.
 *                 example: 2024-10-15
 *     responses:
 *       200:
 *         description: Reserva creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outCode:
 *                   type: integer
 *                   description: Código de salida indicando el éxito o el fallo.
 *                   example: 1
 *                 message:
 *                   type: string
 *                   description: Mensaje indicando el estado de la reserva.
 *                   example: "Reserva creada exitosamente"
 *       400:
 *         description: Error en la reserva por falta de unidades o problemas con la reputación del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outCode:
 *                   type: integer
 *                   description: Código de error indicando el tipo de fallo.
 *                   example: -6
 *                 message:
 *                   type: string
 *                   description: Mensaje de error.
 *                   example: "No hay unidades disponibles para este libro"
 *       401:
 *         description: Error de autorización debido a la falta de un token o un token inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outCode:
 *                   type: integer
 *                   description: Código de error de autorización.
 *                   example: -1
 *                 message:
 *                   type: string
 *                   description: Mensaje de error de autorización.
 *                   example: "Se requiere un token de autorización"
 *       403:
 *         description: Error debido a la reputación del usuario no ser suficiente para realizar la reserva.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outCode:
 *                   type: integer
 *                   description: Código de error indicando problema de reputación.
 *                   example: -7
 *                 message:
 *                   type: string
 *                   description: Mensaje indicando que la reputación del usuario es insuficiente.
 *                   example: "El usuario no tiene la reputación necesaria para hacer reservas"
 *       404:
 *         description: Error debido a que no se encuentra el usuario o el libro en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outCode:
 *                   type: integer
 *                   description: Código de error por recurso no encontrado.
 *                   example: -3
 *                 message:
 *                   type: string
 *                   description: Mensaje de error indicando que el recurso no fue encontrado.
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Error en el servidor al procesar la reserva.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outCode:
 *                   type: integer
 *                   description: Código de error indicando fallo en el servidor.
 *                   example: -8
 *                 message:
 *                   type: string
 *                   description: Mensaje de error interno del servidor.
 *                   example: "Error al procesar la reserva"
 */
reservesRouter.post("/reserve", async (req: Request, res: Response) => {
  const { idBook, checkOutDate } = req.body;

  try {
    // Extraer el token de autorización
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ outCode: -1, message: "Se requiere un token de autorización" });
    }

    // Verificar y decodificar el token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decodedToken as any).userId;

    if (!userId) {
      return res.status(401).json({ outCode: -2, message: "Token inválido" });
    }

    // Obtener detalles del usuario incluyendo el tipo de usuario
    const user = await db
      .select({
        numeroCuenta: users.numeroCuenta,
        reputation: users.reputation,
      })
      .from(users)
      .where(eq(users.userId, userId));

    if (user.length === 0) {
      return res.status(404).json({ outCode: -3, message: "Usuario no encontrado" });
    }

    const { numeroCuenta, reputation } = user[0];

    // Verificar disponibilidad del libro
    const book = await db
      .select({
        unitsAvailable: books.unitsAvailable,
      })
      .from(books)
      .where(eq(books.bookId, idBook));

    if (book.length === 0) {
      return res.status(404).json({ outCode: -4, message: "Libro no encontrado" });
    }

    const { unitsAvailable } = book[0];

    // Verificar condiciones de reputación y disponibilidad
    if (reputation === 10 && unitsAvailable > 0) {
      try {
        // Crear la reserva
        await db.insert(reserves).values({
          bookId: idBook,
          userId,
          createdAt: new Date(),
          checkOutDate,
          status: "Pendiente",
        });

        // Actualizar la disponibilidad del libro
        await db
          .update(books)
          .set({ unitsAvailable: sql`${books.unitsAvailable} - 1` })
          .where(eq(books.bookId, idBook));

        return res.status(200).json({
          outCode: 1,
          message: "Reserva creada exitosamente",
        });
      } catch (error) {
        return res.status(500).json({
          outCode: -5,
          message: "Error al crear la reserva",
        });
      }
    } else if (unitsAvailable <= 0) {
      return res.status(400).json({
        outCode: -6,
        message: "No hay unidades disponibles para este libro",
      });
    } else {
      return res.status(403).json({
        outCode: -7,
        message: "El usuario no tiene la reputación necesaria para hacer reservas",
      });
    }
  } catch (error) {
    return res.status(500).json({
      outCode: -8,
      message: "Error al procesar la reserva",
    });
  }
});


export default reservesRouter;