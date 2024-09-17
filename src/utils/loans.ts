import { db } from "../db/db";
import {
  loans,
  books,
  reserves,
  authors,
  users,
  authorsPerBook,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { formatAuthorsNames, getAuthorsNames } from "./autoresFormat";

export async function getStudenLoans(numeroCuenta: string) {
  //TODO: definir estados de prestamos
  // TODO: mover logica a clase UserHome
  // se quedo con estado activo para los libros que estan en prestamo
  const STATE = "Activo";
  try {
    const results = await db
      .select()
      .from(loans)
      .leftJoin(reserves, eq(loans.reserveId, reserves.reserveId))
      .leftJoin(users, eq(reserves.userId, users.userId))
      .leftJoin(books, eq(reserves.bookId, books.bookId))
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(and(eq(users.numeroCuenta, numeroCuenta), eq(loans.state, STATE)));

    const booksWithAuthors: any = formatAuthorsNames(results);
    const loansData: Array<any> = [];
    results.forEach((result) => {
      const timeDiff: number =
        Number(new Date(result.loans.expiresOn)) - Number(new Date(result.loans.loanedAt));
      const daysDiff: number = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const currentDate = new Date();
      const daysPassed: number =
        (Number(currentDate) - Number(new Date(result.loans.loanedAt))) /
        (1000 * 60 * 60 * 24);
      const timePorcentage = (daysPassed / daysDiff) * 100;
      // format dates to day/month/year
      const day = String(result.loans.expiresOn.getDate()).padStart(2, "0");
      const month = String(result.loans.expiresOn.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based
      const year = result.loans.expiresOn.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // format authors names into a string
      const authorsSet: Set<string> = booksWithAuthors[Number(result.books?.bookId)];
      const authorsNamesFormatted: string = getAuthorsNames(authorsSet)
      const obj = {
        idLoan: result.loans.loanId,
        porcentLoan: timePorcentage,
        returnDate: formattedDate,
        currentBook: { 
            idBook: result.books?.bookId,
            authors: authorsNamesFormatted,
            isbn: result.books?.isbn,
            bookName: result.books?.title 
          }
      };
      if (loansData.filter(loan => loan.idLoan == obj.idLoan).length == 0)
        loansData.push(obj);
    });
    return loansData
  } catch (err) {
    return [];
  }
}
