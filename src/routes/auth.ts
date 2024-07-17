import { Router, type Request, type Response } from "express";
import { newUserSchema, users, type NewUser } from "../db/schema";
import { db } from "../db/db";

const bcrypt = require("bcrypt");
const saltRounds = 10;

export const authRouter: Router = Router();

authRouter.post("/signup", async (req: Request, res: Response) => {
  let user = req.body;
  const parsedUser = newUserSchema.safeParse(user);

  if (!parsedUser.success) {
    return res.status(400).send("Invalid request");
  }
  console.log("Reached!");
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
