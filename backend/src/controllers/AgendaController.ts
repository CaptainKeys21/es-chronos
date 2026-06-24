import type { Request, Response } from "express";
import UserService from "../services/UserService.ts";
import User from "../models/User.ts";
import AgendaService from "../services/AgendaService.ts";
import Agenda, { Visibility } from "../models/Agenda.ts";
import Participant, { Permission } from "../models/Participant.ts";

type CreateReqBody = {
  name: string;
  timezone: string;
  visibility: number;
};

type ParticipantBody = {
  username: string;
  permissions: Permission[];
  roles: string[];
};

type ReqParams = {
  agenda: string;
};

export class AgendaController {
  private readonly userService = UserService.instance;
  private readonly agendaService = AgendaService.instance;

  public getByName = async (req: Request<ReqParams>, res: Response) => {
    const { username } = req;
    const { agenda } = req.params;

    if (typeof agenda !== "string") return res.status(400).send("Bad Request");

    const agendaData = await this.agendaService.getAgendaByName(agenda);

    if (agendaData === null) return res.status(404).send("Not Found");

    const userData = username
      ? await this.userService.getUserByUsername(username)
      : null;
    if (!agendaData.userCanSee(userData)) {
      return res.status(401).send("Unauthorized");
    }
    return res.status(200).json(agendaData.toJSON());
  };

  public create = async (
    req: Request<{}, {}, CreateReqBody>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, timezone, visibility } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const user = await this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not found");

    const enumVis = visibility ? Visibility.private : Visibility.public;

    const newAgenda = new Agenda(name, user, timezone, enumVis);

    await this.agendaService.createAgenda(newAgenda);

    return res.status(201).json(newAgenda);
  };

  public edit = async (
    req: Request<ReqParams, {}, CreateReqBody>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name, timezone, visibility } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const { agenda } = req.params;

    const user = await this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not found");

    const oldAgenda = await this.agendaService.getAgendaByName(agenda);
    if (oldAgenda === null) return res.status(404).send("Agenda Not Found");

    if (!oldAgenda.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const enumVis = visibility ? Visibility.private : Visibility.public;

    await this.agendaService.editAgenda(oldAgenda, name, timezone, enumVis);

    return res.status(200).send("OK");
  };

  public addParticipant = async (
    req: Request<ReqParams, {}, ParticipantBody>,
    res: Response,
  ) => {
    const { username: reqUsername } = req;
    if (!reqUsername) return res.status(401).send("Unauthorized");

    const { username, permissions, roles } = req.body;

    if (!username || !permissions || !roles)
      return res.status(400).send("Bad Request");

    const user = await this.userService.getUserByUsername(reqUsername);
    if (!user) return res.status(404).send("User not found");

    const { agenda } = req.params;
    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (agendaData === null) return res.status(404).send("Agenda Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const pUser = await this.userService.getUserByUsername(username);
    if (!pUser) return res.status(400).send("Bad Request");

    const newParticipant = new Participant(pUser, permissions, roles);

    await this.agendaService.addParticipant(newParticipant, agendaData);

    return res.status(200).send("OK");
  };

  public editParticipant = async (
    req: Request<
      ReqParams & { participant: string },
      {},
      Omit<ParticipantBody, "username">
    >,
    res: Response,
  ) => {
    const { username: reqUsername } = req;
    if (!reqUsername) return res.status(401).send("Unauthorized");

    const { permissions, roles } = req.body;

    if (!permissions || !roles) return res.status(400).send("Bad Request");

    const user = await this.userService.getUserByUsername(reqUsername);
    if (!user) return res.status(404).send("User not found");

    const { agenda, participant } = req.params;
    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (agendaData === null) return res.status(404).send("Agenda Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const pUser = await this.userService.getUserByUsername(participant);
    if (!pUser) return res.status(400).send("Bad Request");

    const participantData = await this.agendaService.getParticipantByUser(
      pUser,
      agendaData,
    );
    if (!participantData) return res.status(404).send("Participant Not Found");

    const updatedParticipant = new Participant(
      pUser,
      permissions,
      roles,
      participantData.id,
    );

    await this.agendaService.editParticipant(updatedParticipant, agendaData);

    return res.status(200).send("OK");
  };

  public removeParticipant = async (
    req: Request<ReqParams & { username: string }>,
    res: Response,
  ) => {
    const { username: reqUsername } = req;
    if (!reqUsername) return res.status(401).send("Unauthorized");

    const { agenda, username } = req.params;

    if (!username) return res.status(400).send("Bad Request");

    const user = await this.userService.getUserByUsername(reqUsername);
    if (!user) return res.status(404).send("User not found");

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (agendaData === null) return res.status(404).send("Agenda Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    const pUser = await this.userService.getUserByUsername(username);
    if (!pUser) return res.status(400).send("Bad Request");

    await this.agendaService.removeParticipant(pUser, agendaData);

    return res.status(200).send("OK");
  };

  public addRole = async (
    req: Request<ReqParams, {}, { name: string }>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const { agenda } = req.params;

    const user = await this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not found");

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (agendaData === null) return res.status(404).send("Agenda Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    await this.agendaService.addRole(agendaData, name);

    return res.status(200).send("OK");
  };

  public removeRole = async (
    req: Request<ReqParams & { role: string }, {}, { name: string }>,
    res: Response,
  ) => {
    const { username } = req;

    if (!username) return res.status(401).send("Unauthorized");

    const { name } = req.body;

    if (!name) return res.status(400).send("Bad Request");

    const { agenda, role } = req.params;

    const user = await this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not found");

    const agendaData = await this.agendaService.getAgendaByName(agenda);
    if (agendaData === null) return res.status(404).send("Agenda Not Found");

    if (!agendaData.userCanEdit(user))
      return res.status(401).send("Unauthorized");

    await this.agendaService.removeRole(agendaData, role);

    return res.status(200).send("OK");
  };
}
