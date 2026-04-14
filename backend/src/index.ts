import express from "express";
import { UserRouter } from "./routes/UserRouter.ts";
import { AgendaRouter } from "./routes/AgendaRouter.ts";

const app = express();

app.use(express.urlencoded({ extended: true }));

const userRouter = new UserRouter();
const agendaRouter = new AgendaRouter();

app.use(express.json());

app.use("/user", userRouter.router);
app.use("/agenda", agendaRouter.router);

app.listen(3000, () => {
  console.log("acessar http://localhost:3000");
});
