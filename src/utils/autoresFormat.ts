export function formatAuthorsNames(list: Array<any>) {
  const booksWithAuthors: any = {}
  list.forEach((element: any) => {
    if (!booksWithAuthors[element.bookId]) booksWithAuthors[element.bookId] = ''
    booksWithAuthors[element.bookId] = booksWithAuthors[element.bookId] + element.authorFirstName + element.authorLastName
  })
  return booksWithAuthors
}

// [{1, author: pepe}, {2, author: nico}, {1, author: pepe2}]  return: {1: "pepe, pepe2, ", 2: "nico,"}