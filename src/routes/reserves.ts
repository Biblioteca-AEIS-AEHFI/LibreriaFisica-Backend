import type { Request, Response } from "express"
import { Router } from "express"
import { eq } from "drizzle-orm"

import { db } from "../db/db"
import { users } from "../db/schema"
import { getToken } from "../utils/tokenInfo"
import { getCheckoutDateNum } from "../utils/loans"


const reservesRouter: Router = Router() 
// make a loan

reservesRouter.post('/', async (req: Request, res: Response) => {
  const loanObj: number = req.body?.idBook
  if (!loanObj) 
    return res.status(400).json({ meesage: 'Request body could not be read' })
  try {
    const token: any = getToken(req)
    const userNumeroCuenta: string = token?.numeroCuenta

    // set checkoutDate to be next day to current day
    // fridays and saturdays in the Date js object correspond to 5 and 6 respectively

    // consider this code to set checkout date, but this should apply only when the loan is accepted.
    /* const currentDate = new Date()
    const checkoutDate = new Date(currentDate)
    const checkoutDay = getCheckoutDateNum(currentDate.getDay())
    checkoutDate.setDate(currentDate.getDate() + checkoutDay) */

    // get student who make the reserve
    // students with the worst type of reputation are not able to make loans
    const student = await db.select().from(users).where(eq(users.numeroCuenta, userNumeroCuenta))
    

  } catch(error) {
    res.status(500).json({ message: 'Could not make loan', outCode: false })
  }
})