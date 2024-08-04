import {type Router, type Request, type Response } from 'express'
import * as swaggerUi from "swagger-ui-express";

const swaggerJSDoc = require("swagger-jsdoc");

// Basic Meta Informations about our API
const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Libreria API Proyecto Asociación", version: "1.0.0" },
  },
  apis: ["./src/routes/auth.ts", "./src/routes/authors.ts", "./src/routes/books.ts", "./src/routes/category.ts", "./src/routes/deleteUser.ts", "./src/routes/user.ts"],
};

// Docs in JSON format
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
export const swaggerDocs = (app: Router, port: string | number) => {
  // Route-Handler to visit our docs
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // Make our docs in JSON format available
  app.get("/api/v1/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  console.log(
    `Version 1 Docs are available on http://localhost:${port}/api/v1/docs`
  );
};