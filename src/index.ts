import express, { type Application } from "express";
import bodyParser from "body-parser";
import { userRouter } from "./routes/users";
import { authRouter } from "./routes/auth";

const port: String|Number = process.env.PORT || 8080;

const app: Application = express();

app.use(bodyParser.json())

app.use('/user', userRouter)
app.use(bodyParser.json());

app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
