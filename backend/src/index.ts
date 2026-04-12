import express from "express";
import router from "./routes.ts";

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(router);

app.listen(3000, () => {
  console.log("acessar http://localhost:3000");
});
