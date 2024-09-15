import { count, eq, gte } from "drizzle-orm";
import { db } from "../db/db";
import {
  authors,
  authorsPerBook,
  books,
  categoriesPerBook,
  loans,
  reserves,
  users,
} from "../db/schema";
import { formatAuthorsNames, getAuthorsNames } from "./autoresFormat";

// TODO: FIX ALL USER HOME ENDPOINTS
export class UserHome {
  static async getRecommendedBooksByMostUserLoans(numeroCuenta: string) {
    const mostBooksCategoriesLoaned: Array<any> = await db
      .select({
        categoryId: categoriesPerBook.categoryId,
        categoryLoanedQuantity: count(categoriesPerBook.categoryId),
      })
      .from(loans)
      .leftJoin(reserves, eq(loans.reserveId, reserves.reserveId))
      .leftJoin(books, eq(reserves.bookId, books.bookId))
      .leftJoin(categoriesPerBook, eq(books.bookId, categoriesPerBook.bookId))
      .leftJoin(users, eq(reserves.userId, users.userId))
      .where(eq(users.numeroCuenta, numeroCuenta))
      .groupBy(categoriesPerBook.categoryId)
      .orderBy(count(categoriesPerBook.categoryId))
    
    if (mostBooksCategoriesLoaned.length == 0) return [];
    // [{1, 3}, {2, 2}, {4, 1}]
    const recommendedBooksByMostUserLoans: Array<any> = [];
    let iterator = 0;
    while (
      recommendedBooksByMostUserLoans.length < 8 &&
      iterator < mostBooksCategoriesLoaned.length
    ) {
      const booksWithMostLoansByCategory = await db
      .select()
      .from(books)
      .leftJoin(categoriesPerBook, eq(categoriesPerBook.bookId, books.bookId))
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(
        eq(
          categoriesPerBook.categoryId,
          mostBooksCategoriesLoaned[iterator].categoryId
        )
      );

      const authorsNames: any = formatAuthorsNames(booksWithMostLoansByCategory);
      booksWithMostLoansByCategory.forEach((res) => {
        const authorsNamesSet: Set<string> = authorsNames[res.books.bookId];
        const formattedAuthorsNames = getAuthorsNames(authorsNamesSet)
        const obj = { authors: formattedAuthorsNames, title: res.books.title, bookId: res.books.bookId, isbn: res.books.isbn };
        if ((recommendedBooksByMostUserLoans.filter(book => book.bookId == obj.bookId)).length == 0)
          recommendedBooksByMostUserLoans.push(obj);
      });

      iterator++;
    }
    return recommendedBooksByMostUserLoans;
  }

  static async getRecommendedBooksByMostUsersLoans() {
    const mostBooksCategoriesLoaned: Array<any> = await db
      .select({
        categoryId: categoriesPerBook.categoryId,
        categoryLoanedQuantity: count(categoriesPerBook.categoryId),
      })
      .from(loans)
      .leftJoin(reserves, eq(loans.reserveId, reserves.reserveId))
      .leftJoin(books, eq(reserves.bookId, books.bookId))
      .leftJoin(categoriesPerBook, eq(books.bookId, categoriesPerBook.bookId))
      .leftJoin(users, eq(reserves.userId, users.userId))
      .groupBy(categoriesPerBook.categoryId)
      .orderBy(count(categoriesPerBook.categoryId))
    
    if (mostBooksCategoriesLoaned.length == 0) return [];
    // [{1, 3}, {2, 2}, {4, 1}]
    const recommendedBooksByMostUserLoans: Array<any> = [];
    let iterator = 0;
    while (
      recommendedBooksByMostUserLoans.length < 8 &&
      iterator < mostBooksCategoriesLoaned.length
    ) {
      const booksWithMostLoansByCategory = await db
      .select()
      .from(books)
      .leftJoin(categoriesPerBook, eq(categoriesPerBook.bookId, books.bookId))
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(
        eq(
          categoriesPerBook.categoryId,
          mostBooksCategoriesLoaned[iterator].categoryId
        )
      );

      const authorsNames: any = formatAuthorsNames(booksWithMostLoansByCategory);
      booksWithMostLoansByCategory.forEach((res) => {
        const authorsNamesSet: Set<string> = authorsNames[res.books.bookId];
        const formattedAuthorsNames = getAuthorsNames(authorsNamesSet)
        const obj = { authors: formattedAuthorsNames, bookId: res.books.bookId, title: res.books.title, isbn: res.books.isbn };
        if ((recommendedBooksByMostUserLoans.filter(book => book.bookId == obj.bookId)).length == 0)
          recommendedBooksByMostUserLoans.push(obj);
      });

      iterator++;
    }
    return recommendedBooksByMostUserLoans;
  }

  static async getPopularBooks() {
    try {
      const results = await db
      .selectDistinct()
      .from(reserves)
      .leftJoin(books, eq(reserves.bookId, books.bookId))
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))

      if (results.length == 0) return []

      const booksMostReserved: Array<any> = []
      const authorsNames: any = formatAuthorsNames(results)
      for (let i = 0; i < results.length; i++) {
        if (booksMostReserved.length >= 8) break

        if (results[i].books?.bookId == null) continue
        const authorsNamesSet: Set<string> = authorsNames[Number(results[i].books?.bookId)] 
        const authorsNamesFormatted = getAuthorsNames(authorsNamesSet)
        const bookObj = { authors: authorsNamesFormatted, bookId: results[i].books?.bookId, title: results[i].books?.title, isbn: results[i].books?.isbn }
        if (booksMostReserved.filter(book => book.bookId == bookObj.bookId).length == 0)
          booksMostReserved.push(bookObj)
      }
      return booksMostReserved
    } catch(err) {
      console.log(err)
      return []
    }
  }

  static async getLastAdded() {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const results = await db
      .select()
      .from(books)
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(gte(books.entryDate, oneMonthAgo))

      if (results.length == 0) return []
      
      const authorsNamesObj = formatAuthorsNames(results)
      const lastAddedBooks: Array<any> = []
      for (let i = 0; i < results.length; i++) {
        if (lastAddedBooks.length >= 15) break 
        
        const authorsNamesSet: Set<string> = authorsNamesObj[results[i].books.bookId]
        const authorsNamesFormatted: string = getAuthorsNames(authorsNamesSet)
        const bookObj = { authors: authorsNamesFormatted, title: results[i].books.title, bookId: results[i].books.bookId, isbn: results[i].books.isbn }
        if (lastAddedBooks.filter(book => book.bookId == bookObj.bookId).length == 0)
          lastAddedBooks.push(bookObj)
      }
      return lastAddedBooks
    } catch(err) {
      return []
    }
  }
}
