import { Router } from "express";
import { AgendaController } from "../controllers/AgendaController.ts";
import { UserController } from "../controllers/UserController.ts";
import { EventRouter } from "./EventRouter.ts";
import { TaskRouter } from "./TaskRouter.ts";

export class AgendaRouter {
  public router: Router;
  private agendaController: AgendaController;

  private eventRouter: EventRouter;
  private taskRouter: TaskRouter;

  constructor() {
    this.router = Router();
    this.agendaController = new AgendaController();

    this.eventRouter = new EventRouter();
    this.taskRouter = new TaskRouter();

    this.initRoutes();
  }

  private initRoutes() {
    // Mapeamento das rotas
    this.router.get(
      "/:agenda",
      UserController.optionalAuthMiddleware,
      this.agendaController.getByName,
    );
    this.router.post(
      "/",
      UserController.authMiddleware,
      this.agendaController.create,
    );
    this.router.put(
      "/:agenda",
      UserController.authMiddleware,
      this.agendaController.edit,
    );

    this.router.post(
      "/:agenda/participant",
      UserController.authMiddleware,
      this.agendaController.addParticipant,
    );

    this.router.put(
      "/:agenda/participant/:participant",
      UserController.authMiddleware,
      this.agendaController.editParticipant,
    );

    this.router.delete(
      "/:agenda/participant/:username",
      UserController.authMiddleware,
      this.agendaController.removeParticipant,
    );
    this.router.post(
      "/:agenda/role",
      UserController.authMiddleware,
      this.agendaController.addRole,
    );

    this.router.delete(
      "/:agenda/role/:role",
      UserController.authMiddleware,
      this.agendaController.removeRole,
    );

    this.router.use("/:agenda/event", this.eventRouter.router);
    this.router.use("/:agenda/task", this.taskRouter.router);
  }
}
