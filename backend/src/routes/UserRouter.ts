import { Router } from "express";
import { UserController } from "../controllers/UserController.ts";

export class UserRouter {
  public router: Router;
  private userController: UserController;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.initRoutes();
  }

  private initRoutes() {
    // Mapeamento das rotas
    this.router.get("/:username", this.userController.getByUsername);
    this.router.post("/", this.userController.create);
  }
}
