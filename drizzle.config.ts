import { defineConfig, type Config } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DB_URL as string,
  },
} satisfies Config);
