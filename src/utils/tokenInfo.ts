import { type Request } from "express";
import jwt from "jsonwebtoken";

export function getToken(req: Request) {
  const token = jwt.decode(req.cookies.access_token);
  return token;
}
