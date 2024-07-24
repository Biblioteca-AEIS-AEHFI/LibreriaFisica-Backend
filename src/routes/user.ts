import { Router, type Request, type Response } from "express";
import { authenticatedUser } from "../middleware/auth.middleware";

export const userRouter: Router = Router();

userRouter.use(authenticatedUser);

userRouter.get("/home", (req: Request, res: Response) => {
  return res.status(200).json({ msg: "YOU WERE AUTHENTICATED" });
});
