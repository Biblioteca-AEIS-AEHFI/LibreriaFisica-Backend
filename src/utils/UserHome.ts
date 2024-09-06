import { count, eq, gte } from "drizzle-orm";
import { db } from "../db/db";
import {
  authors,
  authorsPerBook,
  books,
  categoriesPerBook,
  copies,
  loans,
  reserves,
  users,
} from "../db/schema";
import { formatAuthorsNames } from "./autoresFormat";

// TODO: FIX ALL USER HOME ENDPOINTS
export class UserHome {
  static async getRecommendedBooksByMostUserLoans(numeroCuenta: string) {
    const mostBooksCategoriesLoaned: any = db
      .select({
        categoryId: categoriesPerBook.categoryId,
        categoryLoanedQuantity: count(categoriesPerBook.categoryId),
      })
      .from(loans)
      .leftJoin(reserves, eq(loans.reserveId, reserves.reserveId))
      .leftJoin(copies, eq(reserves.copyId, copies.copyId))
      .leftJoin(categoriesPerBook, eq(copies.bookId, categoriesPerBook.bookId))
      .leftJoin(users, eq(reserves.userId, users.userId))
      .groupBy(categoriesPerBook.categoryId)
      .orderBy(count(categoriesPerBook.categoryId))
      .having(eq(users.numeroCuenta, numeroCuenta))
    
    console.log('MOSTUSERLOAN: ', mostBooksCategoriesLoaned)
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
      .from(categoriesPerBook)
      .leftJoin(books, eq(categoriesPerBook.bookId, books.bookId))
      .leftJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .leftJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
      .where(
        eq(
          categoriesPerBook.categoryId,
          mostBooksCategoriesLoaned[iterator].categoryId
        )
      );

      const authorsNames: Array<any> = formatAuthorsNames(booksWithMostLoansByCategory);
      booksWithMostLoansByCategory.forEach((res) => {
        let authorsNamesFormatted = ''
        if (res.books?.bookId != null)
          authorsNamesFormatted = authorsNames[res.books.bookId];
        const obj = { authors: authorsNamesFormatted, ...res.books };
        recommendedBooksByMostUserLoans.push(obj);
      });

      iterator++;
    }
    return recommendedBooksByMostUserLoans;
  }

  static async getRecommendedBooksByMostUsersLoans() {
    try {
      const mostBooksCategoriesLoaned: any = db
        .select({
          categoryId: categoriesPerBook.categoryId,
          categoryLoanedQuantity: count(categoriesPerBook.categoryId),
        })
        .from(loans)
        .innerJoin(reserves, eq(loans.reserveId, reserves.reserveId))
        .innerJoin(copies, eq(reserves.copyId, copies.copyId))
        .innerJoin(categoriesPerBook, eq(copies.bookId, categoriesPerBook.bookId))
        .groupBy(categoriesPerBook.categoryId)
        .orderBy(count(categoriesPerBook.categoryId));
  
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
          .from(categoriesPerBook)
          .innerJoin(books, eq(categoriesPerBook.bookId, books.bookId))
          .innerJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
          .innerJoin(authors, eq(authorsPerBook.authorId, authors.authorId))
          .where(
            eq(
              categoriesPerBook.categoryId,
              mostBooksCategoriesLoaned[iterator].categoryId
            )
          );
          
        const authorsNames: any = formatAuthorsNames(mostBooksCategoriesLoaned);
        booksWithMostLoansByCategory.forEach((res) => {
          const authorsNamesFormatted = authorsNames[res.books.bookId];
          const obj = { authors: authorsNamesFormatted, ...res.books };
          recommendedBooksByMostUserLoans.push(obj);
        });
  
        iterator++;
      }
      return recommendedBooksByMostUserLoans;
    } catch(err) {
      return []
    }
  }

  static async getPopularBooks() {
    try {
      const results = await db
      .selectDistinct()
      .from(reserves)
      .innerJoin(copies, eq(reserves.copyId, copies.copyId)) 
      .innerJoin(books, eq(copies.bookId, books.bookId))
      .innerJoin(authorsPerBook, eq(books.bookId, authorsPerBook.bookId))
      .innerJoin(authors, eq(authorsPerBook.authorId, authors.authorId))

      if (results.length == 0) return []

      const booksMostReserved: Array<any> = []
      const authorsNames = formatAuthorsNames(results)
      for (let i = 0; i < results.length; i++) {
        if (booksMostReserved.length > 8) break

        const authors = authorsNames(results[i].books.bookId)
        const bookObj = { authors, ...results[i].books}
        booksMostReserved.push(bookObj)
      }
      /* results.forEach(book => {
        booksMostReserved.push(bookObj)
      }) */
      return booksMostReserved
    } catch(err) {
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
      
      const authorsNames = formatAuthorsNames(results)
      const lastAddedBooks: Array<any> = []
      for (let i = 0; i < results.length; i++) {
        if (lastAddedBooks.length > 15) break 
        
        const authorsNamesFormatted = authorsNames[results[i].books.bookId]
        const bookObj = { authors: authorsNamesFormatted, title: results[i].books.title, bookId: results[i].books.bookId, isbn: results[i].books.isbn }
        lastAddedBooks.push(bookObj)
      }
      return lastAddedBooks
    } catch(err) {
      return []
    }
  }
}
