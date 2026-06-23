import { Router } from "express";
import { UserController } from "../controllers/UserController.ts";
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
    this.router.put(
      "/:task/assign",
      UserController.authMiddleware,
      this.taskController.assign,
    );
    this.router.put(
      "/:task/unassign",
      UserController.authMiddleware,
      this.taskController.unassign,
    );
  }
}
