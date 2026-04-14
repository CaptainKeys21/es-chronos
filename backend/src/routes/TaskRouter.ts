import { Router } from "express";
import { UserController } from "../controllers/UserController.ts";
import { EventController } from "../controllers/EventController.ts";
import { TaskController } from "../controllers/TaskController.ts";

export class TaskRouter {
  public router: Router;
  private taskController: TaskController;

  constructor() {
    this.router = Router({ mergeParams: true });
    this.taskController = new TaskController();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/:task", this.taskController.getByName);
    this.router.post(
      "/",
      UserController.authMiddleware,
      this.taskController.create,
    );
    this.router.put(
      "/:task",
      UserController.authMiddleware,
      this.taskController.edit,
    );
  }
}
