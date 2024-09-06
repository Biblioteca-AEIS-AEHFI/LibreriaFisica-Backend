export function formatAuthorsNames(list: Array<any>) {
  const booksWithAuthors: any = {}
  list.forEach((element: any) => {
    if (!booksWithAuthors[element.books.bookId]) booksWithAuthors[element.books.bookId] = new Set()
    booksWithAuthors[element.books.bookId].add(element.authors.firstName + " " + element.authors.lastName) 
  })
  return booksWithAuthors
}

export function getAuthorsNames(list: Set<string>): string {
  let authors = ''
  list.forEach(author => {
    authors += author + ", "
  })
  return authors
}

// [{1, author: pepe}, {2, author: nico}, {1, author: pepe2}]  return: {1: "pepe, pepe2, ", 2: "nico,"}