import express, { type Application } from "express";
import bodyParser from "body-parser";
import { authRouter } from "./routes/auth";

const port = process.env.PORT;

const app: Application = express();

app.use(bodyParser.json());

app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
