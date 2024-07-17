import express, { type Application } from "express";
import bodyParser from "body-parser";
import { userRouter } from "./routes/users";

const port: String|Number = process.env.PORT || 8080;

const app: Application = express();

app.use(bodyParser.json())

app.use('/user', userRouter)

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
