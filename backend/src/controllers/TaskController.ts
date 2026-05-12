import type { Request, Response } from "express";
import UserService from "../services/UserService.ts";
import AgendaService from "../services/AgendaService.ts";
import TaskService from "../services/TaskService.ts";
import Task from "../models/Task.ts";

type CreateReqBody = {
  name: string;
  date: string;
};

type ReqParams = {
  agenda: string;
  task: string;
};

export class TaskController {
  private readonly userService = UserService.instance;
  private readonly agendaService = AgendaService.instance;
  private readonly taskService = TaskService.instance;

  public getByName = (req: Request<ReqParams>, res: Response) => {
    const { agenda, task } = req.params;

    const agendaData = this.agendaService.getAgendaByName(agenda);

    if (agendaData === null) return res.status(404).send("Agenda not Found");

    const taskData = this.taskService.getTaskByName(task, agendaData);

    if (taskData === null) return res.status(404).send("Not Found");

    return res.status(200).json(taskData.toJSON());
  };

  public create = (
    req: Request<ReqParams, {}, CreateReqBody>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, date } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const { agenda } = req.params;

    const user = this.userService.getUserByUsername(username);
    if (!user) return res.status(404).send("User not found");

    const agendaData = this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const task = new Task(name, new Date(date));

    this.taskService.createTask(task, agendaData);

    return res.status(201).send("Created");
  };

  public edit = (req: Request<ReqParams, {}, CreateReqBody>, res: Response) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, date } = req.body;

    if (!name || !date) return res.status(400).send("Bad Request");

    const { agenda, task } = req.params;

    const agendaData = this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    const user = this.userService.getUserByUsername(username);
    if (!user) return res.status(404).send("User not found");

    const taskData = this.taskService.getTaskByName(task, agendaData);
    if (taskData === null) return res.status(404).send("Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const newTask = new Task(name, new Date(date));
    this.taskService.editTask(taskData, newTask, agendaData);

    return res.status(200).send("OK");
  };
}
