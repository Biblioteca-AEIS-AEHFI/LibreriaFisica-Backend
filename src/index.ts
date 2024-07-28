import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import { userRouter } from "./routes/user";
import { authRouter } from "./routes/auth";
import { author } from "./routes/authors";
import { verifyToken } from "./middleware/auth.middleware";

const port: String | Number = process.env.PORT || 8080;

const app: Application = express();

const FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:5173/'
const corsOptions = {
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());

app.use("/auth", authRouter);

app.use(verifyToken);
app.use("/user", userRouter);
app.use("/author", author);

export { app };

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});


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