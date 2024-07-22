import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface CustomRequest extends Request {
  token: string | JwtPayload;
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ msg: "access denied" });
  }

  const SECRET_KEY: string = process.env.SECRET_KEY || "prueba";

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    if (payload) {
      (req as CustomRequest).token = payload;
      next();
    }
  } catch (error) {
    return res.status(500).json({ msg: "could not authenticate" });
  }
}
