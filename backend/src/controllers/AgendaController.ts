import type { Request, Response } from "express";
import UserService from "../services/UserService.ts";
import User from "../models/User.ts";
import AgendaService from "../services/AgendaService.ts";
import Agenda, {
  Permission,
  Visibility,
  type Participant,
} from "../models/Agenda.ts";

type CreateReqBody = {
  name: string;
  timezone: string;
  participants?: string[];
  visibility: number;
};

type ReqParams = {
  agenda: string;
};

export class AgendaController {
  private readonly userService = UserService.instance;
  private readonly agendaService = AgendaService.instance;

  public getByName = (req: Request<ReqParams>, res: Response) => {
    const { username } = req;
    const { agenda } = req.params;

    if (typeof agenda !== "string") return res.status(400).send("Bad Request");

    const agendaData = this.agendaService.getAgendaByName(agenda);

    if (agendaData === null) return res.status(404).send("Not Found");

    const userData = username
      ? this.userService.getUserByUsername(username)
      : null;
    if (!agendaData.userCanSee(userData)) {
      return res.status(401).send("Unauthorized");
    }
    return res.status(200).json(agendaData.toJSON());
  };

  public create = (req: Request<{}, {}, CreateReqBody>, res: Response) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, timezone, participants, visibility } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const user = this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not found");

    const userParticipants: Participant[] = [];
    if (participants) {
      participants.forEach((p) => {
        const up = this.userService.getUserByUsername(p);
        if (up)
          userParticipants.push({
            user: up,
            permissions: [Permission.read, Permission.write],
          });
      });
    }

    const enumVis = visibility ? Visibility.private : Visibility.public;

    const newAgenda = new Agenda(
      name,
      user,
      timezone,
      enumVis,
      userParticipants,
    );

    this.agendaService.createAgenda(newAgenda);

    return res.status(201).json(newAgenda);
  };

  public edit = (req: Request<ReqParams, {}, CreateReqBody>, res: Response) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, timezone } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const { agenda } = req.params;

    const user = this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not found");

    const oldAgenda = this.agendaService.getAgendaByName(agenda);
    if (oldAgenda === null) return res.status(404).send("Agenda Not Found");

    if (!oldAgenda.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    this.agendaService.editAgenda(oldAgenda, name, timezone);

    return res.status(200).send("OK");
  };
}
