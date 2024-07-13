import express, { type Application } from "express";

const port = process.env.PORT;

const app: Application = express();

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
