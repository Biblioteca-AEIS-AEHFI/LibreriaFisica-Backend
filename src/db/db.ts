import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

export const connection = await mysql.createConnection(
  process.env.DB_CONNECTION_URL as string
);

export const db = drizzle(connection);