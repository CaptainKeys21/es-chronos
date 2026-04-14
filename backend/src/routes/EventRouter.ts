import { Router } from "express";
import { UserController } from "../controllers/UserController.ts";
import { EventController } from "../controllers/EventController.ts";

export class EventRouter {
  public router: Router;
  private eventController: EventController;

  constructor() {
    this.router = Router({ mergeParams: true });
    this.eventController = new EventController();
    this.initRoutes();
  }

  private initRoutes() {
    // Mapeamento das rotas
    this.router.get("/:event", this.eventController.getByName);
    this.router.post(
      "/",
      UserController.authMiddleware,
      this.eventController.create,
    );
    this.router.put(
      "/:event",
      UserController.authMiddleware,
      this.eventController.edit,
    );
  }
}
