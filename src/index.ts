import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import { type Router, type Request, type Response } from "express";
import * as swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "./v1/swagger";
import { swaggerSpec } from "./v1/swagger";
import { userRouter } from "./routes/user";
import { authRouter } from "./routes/auth";
import { author } from "./routes/authors";
import { loansRouter } from "./routes/loans";
import { book } from "./routes/books";
import { categoryRouter } from "./routes/category";
import { verifyToken } from "./middleware/auth.middleware";
import { searchRouter } from "./routes/search";

const swaggerJSDoc = require("swagger-jsdoc");
const port: string | number = process.env.PORT || 8080;

const app: Application = express();

const FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:5173'
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());

app.listen(port, () => {
  console.log(`App running on port ${port}`);
  swaggerDocs(app, port)
});

app.use("/auth", authRouter);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/v1/docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});


app.use(verifyToken);
app.use("/prestamos", loansRouter)
app.use("/user", userRouter);
app.use('/search', searchRouter)
app.use("/author", author);
app.use('/categorias', categoryRouter)
app.use('/books', book)



// // Bloque para pruebas CRUD autores
// import express, { type Application } from "express";
// import cookieParser from "cookie-parser";
// import bodyParser from "body-parser";
// import cors from "cors";
// import { author } from "./routes/authorsTest";

// const port = 8080;

// const app: Application = express();

// const corsOptions = {
//   origin: '*', 
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// app.use(bodyParser.json());
// app.use(cookieParser());

// app.use("/author", author);

// app.listen(port, () => {
//   console.log(`App running on port ${port}`);
// });

// export { app };

// // Bloque para pruebas CRUD libros
// import express, { type Application } from "express";
// import cookieParser from "cookie-parser";
// import bodyParser from "body-parser";
// import cors from "cors";
// import { book } from "./routes/booksTest";

// const port = 8080;

// const app: Application = express();

// const corsOptions = {
//   origin: '*', 
//   optionsSuccessStatus: 200,
// };
// app.use(cors(corsOptions));

// app.use(bodyParser.json());
// app.use(cookieParser());

// app.use("/book", book);

// app.listen(port, () => {
//   console.log(`App running on port ${port}`);
// });

// export { app };