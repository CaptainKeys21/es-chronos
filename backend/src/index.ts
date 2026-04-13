import express from "express";
import { UserRouter } from "./routes/UserRouter.ts";

const app = express();

app.use(express.urlencoded({ extended: true }));

const userRouter = new UserRouter();
app.use(userRouter.router);

app.listen(3000, () => {
  console.log("acessar http://localhost:3000");
});
