import { Router, type Request, type Response } from "express";
import * as bcrypt from 'bcrypt'
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import { users, type User } from "../db/schema";

export const userRouter: Router = Router();

const loginSchema = z.object({
  numeroCuenta: z.string(),
  password: z.string().min(6),
});

userRouter.post("/login", async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const err: ZodError = result.error;
    return res.status(400).json({ errors: err.errors });
  }

  const { numeroCuenta, password } = req.body;

  // agregar que result es de tipo user
  const userQuery: User[] | any = await db
    .select()
    .from(users)
    .where(eq(users.numeroCuenta, numeroCuenta));

  const user = userQuery[0]
  if (!user)
    return res.status(401).json({ msg: "User credentials are not valid" });

  const matchPassword = await bcrypt.compare(password, user.password)

  if (!matchPassword)
    return res.status(401).json({ msg: "User credentials are not valid" });

  //TODO: se deberia crear una session cookie para el usuario
  res.status(200).json(user);
});

