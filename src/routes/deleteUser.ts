import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { z, ZodError } from "zod";
import { db } from "../db/db";
import { users, type User } from "../db/schema";

export const userDeleteRouter: Router = Router();

const idUserSchema = z.object({
  userId: z.number().int()
});

userDeleteRouter.delete("/user/:id", async (req: Request, res: Response) => {
  const result = idUserSchema.safeParse(req.params);
  if (!result.success) {
    const err: ZodError = result.error;
    return res.status(400).json({ errors: err.errors });
  }

  const { userId } = result.data;

  try{
    const checkUserQuert = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId));

    if(checkUserQuert.length > 0){
      try{
        const deleteUserQuery = await db
            .delete(users)
            .where(eq(users.userId, userId));
  
        return res.json({
          status: 200,
          message: `User with id: ${userId} deleted successfully`
        });
      }catch(error){
        return res.status(500).json({
            message: 'Error deleting user',
            error
        });
      }
    }
  }catch(error){
    return res.status(500).json({
      message: 'Error searching for user to delete',
      error
    });
  }
  
});
