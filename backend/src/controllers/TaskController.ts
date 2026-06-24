import type { Request, Response } from "express";
import UserService from "../services/UserService.ts";
import AgendaService from "../services/AgendaService.ts";
import TaskService from "../services/TaskService.ts";
import Task from "../models/Task.ts";
import { StateError } from "../errors/stateError.ts";

type CreateReqBody = {
  name: string;
  date: string;
};

type EditReqBody = CreateReqBody & {
  progress: number;
};

type ReqParams = {
  agenda: string;
  task: string;
};

export class TaskController {
  private readonly userService = UserService.instance;
  private readonly agendaService = AgendaService.instance;
  private readonly taskService = TaskService.instance;

  public getByName = async (req: Request<ReqParams>, res: Response) => {
    const { agenda, task } = req.params;

    const agendaData = await this.agendaService.getAgendaByName(agenda);

    if (agendaData === null) return res.status(404).send("Agenda not Found");

    const taskData = await this.taskService.getTaskByName(task, agendaData);

    if (taskData === null) return res.status(404).send("Not Found");

    return res.status(200).json(taskData.toJSON());
  };

  public create = async (
    req: Request<ReqParams, {}, CreateReqBody>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, date } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const { agenda } = req.params;

    const user = await this.userService.getUserByUsername(username);
    if (!user) return res.status(404).send("User not found");

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const task = new Task(name, new Date(date), 0, null);

    this.taskService.createTask(task, agendaData);

    return res.status(201).send("Created");
  };

  public edit = async (
    req: Request<ReqParams, {}, EditReqBody>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, date, progress } = req.body;

    if (!name || !date) return res.status(400).send("Bad Request");

    const { agenda, task } = req.params;

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    const user = await this.userService.getUserByUsername(username);
    if (!user) return res.status(404).send("User not found");

    const taskData = await this.taskService.getTaskByName(task, agendaData);
    if (taskData === null) return res.status(404).send("Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    if (!agendaData.isUserOwner(user) && !taskData.isOwner(user))
      return res.status(401).send("Unauthorized");

    taskData.name = name;
    taskData.deadline = new Date(date);
    try {
      taskData.progress = progress;
    } catch (error) {
      if (error instanceof StateError) {
        res.status(400).send(error.message);
      }
    }

    this.taskService.editTask(taskData, agendaData);

    return res.status(200).send("OK");
  };

  public assign = async (
    req: Request<ReqParams, {}, { username: string }>,
    res: Response,
  ) => {
    const { username: reqUsername } = req;

    if (!reqUsername) return res.status(401).send("Unauthorized");

    const { agenda, task } = req.params;

    const reqUser = await this.userService.getUserByUsername(reqUsername);
    if (!reqUser) return res.status(404).send("User not found");

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    if (!agendaData.userCanEdit(reqUser))
      return res.status(401).send("Unauthorized");

    const taskData = await this.taskService.getTaskByName(task, agendaData);
    if (taskData === null) return res.status(404).send("Not Found");

    const { username } = req.body;

    const userToBeAssigned = await this.userService.getUserByUsername(username);

    if (!userToBeAssigned || !agendaData.isUserParticipating(userToBeAssigned))
      return res.status(400).send("Bad Request");

    await this.taskService.assignUser(taskData, userToBeAssigned);

    return res.status(200).send("OK");
  };

  public unassign = async (req: Request<ReqParams>, res: Response) => {
    const { username: reqUsername } = req;

    if (!reqUsername) return res.status(401).send("Unauthorized");

    const { agenda, task } = req.params;

    const reqUser = await this.userService.getUserByUsername(reqUsername);
    if (!reqUser) return res.status(404).send("User not found");

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    if (!agendaData.userCanEdit(reqUser))
      return res.status(401).send("Unauthorized");

    const taskData = await this.taskService.getTaskByName(task, agendaData);
    if (taskData === null) return res.status(404).send("Not Found");

    await this.taskService.unassignUser(taskData);

    return res.status(200).send("OK");
  };
}
