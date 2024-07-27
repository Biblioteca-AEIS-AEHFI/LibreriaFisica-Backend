import { Router, type Request, type Response } from "express";
import {
  NewUserSchema,
  users,
  type NewUser,
  type User,
} from "../db/schema/users";
import { loginSchema } from "../utils/definitions";
import { db } from "../db/db";

import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

const saltRounds = 10;

export const authRouter: Router = Router();

authRouter.post("/signup", async (req: Request, res: Response) => {
  let user = req.body;
  const parsedUser = NewUserSchema.safeParse(user);

  if (!parsedUser.success) {
    return res.status(400).send("Invalid request");
  }

  try {
    let userData = parsedUser!.data as NewUser;
    // Hash password for storage
    const hashedPassword = await bcrypt.hash(
      parsedUser.data!.password,
      saltRounds
    );
    userData!.password = hashedPassword;
    // TODO: Implement UUID for userId
    await db.insert(users).values(userData);
    return res.status(200).send(`Inserted new user ${parsedUser.data?.email}`);
  } catch (error) {
    console.log(error);
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
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
      .where(eq(users.account, numeroCuenta));

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
