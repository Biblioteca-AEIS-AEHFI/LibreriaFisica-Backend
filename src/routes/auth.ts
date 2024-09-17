import { Router, type Request, type Response } from "express";
import {
  NewUserSchema,
  users,
  type NewUser,
  type User,
} from "../db/schema/users";
import { NewUserSchema, users, type NewUser, type User } from "../db/schema";
import { loginSchema } from "../utils/definitions";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

const saltRounds: number = Number(process.env.SALT_ROUND) || 10;
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
    console.log("error", error);
    return res.status(500).json({ msg: "Could not create user" });
  }
});

/**
 *@openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login for users
 *     requestBody:
 *       required: true
 *       content:
 *        application/json:
 *          schema:
 *           type: object 
 *           required: 
 *            - numeroCuenta
 *            - password
 *           properties:
 *            numeroCuenta:
 *              type: string
 *            password:
 *              type: string
 *     responses:
 *       200:
 *         description: OK
 *         headers:
 *          access_token:
 *            description: cookie with session user info
 *            schema:
 *              type: object
 *              required:
 *                - userId
 *                - tipo
 *              properties:
 *                userId:
 *                  type: string
 *                tipo:
 *                  type: number
 *              example: { userId: numeroCuenta, tipo: 1}
 *         content:
 *           application/json:
 *             schema:
 *              $ref: "#/components/schemas/User"
 *       5XX:
 *         description: FAILED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg: 
 *                   type: string
 *                   example: Error while login 
 * 
 *components:
 *  schemas:
 *     User:
 *      type: object
 *      properties:
 *        userId:
 *          type: integer
 *          description: "Primary key for the user"
 *          example: 1
 *        numeroCuenta:
 *          type: string
 *          maxLength: 15
 *          description: "Unique account number"
 *          example: "123456789012345"
 *        firstName:
 *          type: string
 *          maxLength: 35
 *          description: "First name of the user"
 *          example: "John"
 *        secondName:
 *          type: string
 *          maxLength: 35
 *          description: "Second name of the user"
 *          example: "Michael"
 *        firstSurname:
 *          type: string
 *          maxLength: 35
 *          description: "First surname of the user"
 *          example: "Doe"
 *        secondSurname:
 *          type: string
 *          maxLength: 35
 *          description: "Second surname of the user"
 *          example: "Smith"
 *        email:
 *          type: string
 *          maxLength: 40
 *          description: "Unique email address"
 *          example: "john.doe@example.com"
 *        phoneNumber:
 *          type: string
 *          maxLength: 8
 *          description: "Unique phone number"
 *          example: "12345678"
 *        userType:
 *          type: integer
 *          description: "ID referencing the user type"
 *          example: 2
 *        reputation:
 *          type: integer
 *          description: "ID referencing the user reputation"
 *          example: 3
 *        password:
 *          type: string
 *          maxLength: 60
 *          description: "User's password"
 *          example: "hashedpassword123"
 *      required:
 *        - userId
 *        - numeroCuenta
 *        - firstName
 *        - firstSurname
 *        - email
 *        - password
 */

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

    const user: User = userQuery[0];
    if (!user)
      return res.status(401).json({ msg: "User credentials are not valid" });

    if (!user.enabled) return res.status(403).json({ msg: "user is banned" })

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword)
      return res.status(401).json({ msg: "User credentials are not valid" });

    // creating cookie session
    const SECRET_KEY: string = process.env.SECRET_KEY || "prueba";
    if (!SECRET_KEY) {
      return res.status(500).json({ msg: "Could not authenticate user" });
    }

    const object = {
      firstName: user.firstName,
      id: user.userId,
      numeroCuenta: user.numeroCuenta,
      tipo: user.userType,
    };

    const token = jwt.sign(object, SECRET_KEY, {
      expiresIn: "7d",
    });

    // TODO: change maxage to be just 5h
    res
      .status(200)
      .cookie("access_token", token, {
        sameSite: "strict",
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60,
      })
      .json({ numeroCuenta: user.numeroCuenta, firstName: user.firstName, secondName: user.secondName, userType: user.userType });
  } catch (error) {
    return res.status(500).json({ msg: "Error while login" });
  }
});

/**
 * 
 *@openapi
 * /auth/logout:
 *  post:
 *    tags: 
 *      - Auth
 *    summary: close session 
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - message
 *              properties:
 *                message:
 *                  type: string
 *      5xx:
 *        description: FAILED
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - message
 *              properties:
 *                message:
 *                  type: string 
 * 
 * 
 */
authRouter.post("/logout", (req: Request, res: Response) => {
  try {
    res.clearCookie("access_token").status(200).json({
    message: "logout successful",
    });
  } catch(err) {
    res.status(500).json({ message: "Error while logging out" })
  }
});
