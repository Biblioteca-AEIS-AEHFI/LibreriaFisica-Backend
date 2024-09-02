import { db } from "../db/db";
import {
  loans,
  books,
  reserves,
  authors,
  copies,
  users,
  authorsPerBook,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { formatAuthorsNames } from "./autoresFormat";

export async function getStudenLoans(numeroCuenta: string) {
  const STATE = "EN CURSO";
  try {
    const results = await db
      .select({
        loanId: loans.loanId,
        expiresOn: loans.expiresOn,
        loanedAt: loans.loanedAt,
        bookId: books.bookId,
        isbn: books.isbn,
        bookTitle: books.title,
        authorFirstName: authors.firstName,
        authorLastName: authors.lastName,
      })
      .from(loans)
      .innerJoin(reserves, eq(loans.reserveId, reserves.reserveId))
      .innerJoin(users, eq(reserves.userId, users.userId))
      .innerJoin(copies, eq(reserves.copyId, copies.copyId))
      .innerJoin(books, eq(copies.bookId, books.bookId))
      .innerJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .innerJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(and(eq(users.numeroCuenta, numeroCuenta), eq(loans.state, STATE)));

    const booksWithAuthors: any = formatAuthorsNames(results);
    const loansData: Array<any> = [];
    results.forEach((result) => {
      const timeDiff: number =
        Number(new Date(result.expiresOn)) - Number(new Date(result.loanedAt));
      const daysDiff: number = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const currentDate = new Date();
      const daysPassed: number =
        (Number(currentDate) - Number(new Date(result.loanedAt))) /
        (1000 * 60 * 60 * 24);
      const timePorcentage = (daysPassed / daysDiff) * 100;
      // format dates to day/month/year
      const day = String(result.expiresOn.getDate()).padStart(2, "0");
      const month = String(result.expiresOn.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based
      const year = result.expiresOn.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      // format authors names into a string
      const authors = booksWithAuthors[result.bookId];
      authors[authors.length - 1] = ".";
      const obj = {
        porcentLoan: timePorcentage,
        returnDate: formattedDate,
        authors: authors,
        ...result,
      };
      loansData.push(obj);
    });
  } catch (err) {
    return [];
  }
}
