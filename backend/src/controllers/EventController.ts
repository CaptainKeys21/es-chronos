import type { Request, Response } from "express";
import UserService from "../services/UserService.ts";
import AgendaService from "../services/AgendaService.ts";
import EventService from "../services/EventService.ts";
import Event, { WeekDays } from "../models/Event.ts";
import { StateError } from "../errors/stateError.ts";

type CreateReqBody = {
  name: string;
  date: string;
  weekdays: string[];
};

type ReqParams = {
  agenda: string;
  event: string;
};

export class EventController {
  private readonly userService = UserService.instance;
  private readonly agendaService = AgendaService.instance;
  private readonly eventService = EventService.instance;

  public getByName = async (req: Request<ReqParams>, res: Response) => {
    const { agenda, event } = req.params;

    const agendaData = await this.agendaService.getAgendaByName(agenda);

    if (agendaData === null) return res.status(404).send("Agenda not Found");

    const eventData = await this.eventService.getEventByName(event, agendaData);

    if (eventData === null) return res.status(404).send("Not Found");

    return res.status(200).json(eventData.toJSON());
  };

  public create = async (
    req: Request<ReqParams, {}, CreateReqBody>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, date, weekdays } = req.body;

    if (!name || !date) return res.status(400).send("Bad Request");

    const { agenda } = req.params;

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    const user = await this.userService.getUserByUsername(username);
    if (!user) return res.status(404).send("User not found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const wdEnum = weekdays
      .map((v) => v in WeekDays && WeekDays[v as keyof typeof WeekDays])
      .filter((v) => v !== false);
    const event = new Event(name, new Date(date), wdEnum, "ORGANIZING");
    this.eventService.createEvent(event, agendaData);

    return res.status(201).send("Created");
  };

  public edit = async (
    req: Request<
      ReqParams,
      {},
      CreateReqBody & { status: "ORGANIZING" | "IN_PROGRESS" | "COMPLETED" }
    >,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, date, weekdays, status } = req.body;

    if (!name || !date) return res.status(400).send("Bad Request");

    const { agenda, event } = req.params;

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (!agendaData) return res.status(404).send("Agenda not found");

    const user = await this.userService.getUserByUsername(username);
    if (!user) return res.status(404).send("User not found");

    const eventData = await this.eventService.getEventByName(event, agendaData);
    if (eventData === null) return res.status(404).send("Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const wdEnum = weekdays
      .map((v) => v in WeekDays && WeekDays[v as keyof typeof WeekDays])
      .filter((v) => v !== false);

    try {
      eventData.name = name;
      eventData.date = new Date(date);
      eventData.weekdays = wdEnum;

      switch (status) {
        case "ORGANIZING":
          break;
        case "IN_PROGRESS":
          if (eventData.status !== status) eventData.start();
          break;
        case "COMPLETED":
          if (eventData.status !== status) eventData.complete();
          break;
        default:
          res.status(400).send("State inválido");
      }
    } catch (error) {
      if (error instanceof StateError) {
        res.status(400).send(error.message);
      }
    }

    this.eventService.editEvent(eventData, agendaData);

    return res.status(200).send("OK");
  };
}
