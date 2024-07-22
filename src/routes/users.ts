import { Router, type Request, type Response } from "express";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import { users, type User } from "../db/schema";
import { verifyToken } from "../middlewares/authMiddleware";

export const userRouter: Router = Router();

const loginSchema = z.object({
  numeroCuenta: z.string(),
  password: z.string().min(6),
});

userRouter.post("/login", async (req: Request, res: Response) => {
  try {
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

    const user = userQuery[0];
    if (!user)
      return res.status(401).json({ msg: "User credentials are not valid" });

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword)
      return res.status(401).json({ msg: "User credentials are not valid" });

    // creating cookie session
    const SECRET_KEY: string = process.env.SECRET_KEY || "prueba";
    if (!SECRET_KEY) {
      return res.status(500).json({ msg: "Could not authenticate user" });
    }

    const token = jwt.sign({ userId: user.numeroCuenta }, SECRET_KEY, {
      expiresIn: "7d",
    });

    res.status(200).cookie("access_token", token).json(user);
  } catch (error) {
    return res.status(500).json({ msg: "Error while login", e: error });
  }
});

userRouter.use(verifyToken);

userRouter.get("/home", (req: Request, res: Response) => {
  return res.status(200).json({ msg: "YOU WERE AUTHENTICATED" });
});
