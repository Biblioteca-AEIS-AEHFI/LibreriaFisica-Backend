import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { userRouter } from "./routes/users";
import { authRouter } from "./routes/auth";
import { verifyToken } from "./middlewares/authMiddleware";

const port: String | Number = process.env.PORT || 8080;

const app: Application = express();

app.use(bodyParser.json());
app.use("/auth", authRouter);

app.use(cookieParser());
app.use(verifyToken);
app.use("/user", userRouter);

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
