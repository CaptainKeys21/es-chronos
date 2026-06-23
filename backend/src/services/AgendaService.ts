import db from "../db/index.ts";
import type {
  RoleRow,
  AgendaRow,
  ParticipantRow,
  ParticipantRoleRow,
} from "../db/types.ts";
import Agenda, { Visibility } from "../models/Agenda.ts";
import Participant from "../models/Participant.ts";
import type User from "../models/User.ts";
import EventService from "./EventService.ts";
import TaskService from "./TaskService.ts";
import UserService from "./UserService.ts";

export default class AgendaService {
  private static _instance: AgendaService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new AgendaService();
    }

    return this._instance;
  }

  private constructor() {}

  public async createAgenda(agenda: Agenda) {
    await db<AgendaRow>("agenda").insert({
      id: agenda.id,
      name: agenda.name,
      timezone: agenda.timeZone,
      visibility: agenda.visibility.toString(),
      owner_id: agenda.owner.id,
    });
  }

  public async editAgenda(
    agenda: Agenda,
    newName: string,
    newTZ: string,
    newVis: Visibility,
  ) {
    console.log(agenda.id);
    await db<AgendaRow>("agenda")
      .update({ name: newName, timezone: newTZ, visibility: newVis.toString() })
      .where({ id: agenda.id });

    agenda.name = newName;
    agenda.timeZone = newTZ;
    agenda.visibility = newVis;
  }

  public async getAgendaByName(name: string) {
    // Agenda base
    const agendaRow = await db<AgendaRow>("agenda")
      .select("*")
      .where({ name })
      .first();
    if (!agendaRow) {
      return null;
    }

    const user = await UserService.instance.getUserById(agendaRow.owner_id);

    const agenda = Agenda.fromDatabase(agendaRow, user!);

    // Tasks
    const tasks = await TaskService.instance.getTasksByAgendaId(agenda.id);
    agenda.addTask(...tasks);

    // Events
    const events = await EventService.instance.getEventsByAgendaId(agenda.id);
    agenda.addEvent(...events);

    // Participant
    const participants = await this.getParticipantsByAgenda(agenda);
    agenda.addParticipant(...participants);

    // Roles
    const roles = await this.getRolesByAgenda(agenda);
    agenda.addRoles(...roles);

    return agenda;
  }

  public async getAgendaByUsername(user: User) {
    const agendaRow = await db<AgendaRow>("agenda")
      .select("*")
      .where({ owner_id: user.id })
      .first();
    if (!agendaRow) {
      return null;
    }

    return Agenda.fromDatabase(agendaRow, user);
  }

  public async getParticipantsByAgenda(agenda: Agenda): Promise<Participant[]> {
    const pRows = await db<ParticipantRow>("participant")
      .select("*")
      .where({ agenda_id: agenda.id });

    if (pRows.length === 0) return [];

    const participantIds = pRows.map((p) => p.id);
    const userIds = pRows.map((p) => p.user_id);

    const users = await UserService.instance.getUsersByIds(userIds);
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const rolesRows = await db("role")
      .select("participant_role.p_id", "role.name")
      .innerJoin("participant_role", "role.id", "participant_role.r_id")
      .whereIn("participant_role.p_id", participantIds);

    const rolesByParticipantMap = new Map<string, string[]>();

    for (const row of rolesRows) {
      const currentRoles = rolesByParticipantMap.get(row.p_id) || [];
      currentRoles.push(row.name);
      rolesByParticipantMap.set(row.p_id, currentRoles);
    }

    // 5. Monta o array de entidades do seu domínio de forma síncrona e ultra rápida
    return pRows.map((pRow) => {
      const user = usersMap.get(pRow.user_id);
      const rolesNames = rolesByParticipantMap.get(pRow.id) || [];

      if (!user) {
        throw new Error(
          `Inconsistência no banco: Usuário ${pRow.user_id} não encontrado para o participante ${pRow.id}`,
        );
      }

      return Participant.fromDatabase(pRow, rolesNames, user);
    });
  }

  public async getParticipantByUser(user: User, agenda: Agenda) {
    const pRow = await db<ParticipantRow>("participant")
      .select("*")
      .where({ user_id: user.id, agenda_id: agenda.id })
      .first();

    if (!pRow) return null;

    const rolesRows: Pick<RoleRow, "name">[] = await db<RoleRow>("role")
      .select("role.name")
      .innerJoin("participant_role", "role.id", "participant_role.r_id")
      .where("participant_role.p_id", pRow.id);

    const rolesNames = rolesRows.map((row) => row.name);

    return Participant.fromDatabase(pRow, rolesNames, user);
  }

  public async addParticipant(participant: Participant, agenda: Agenda) {
    await db<ParticipantRow>("participant").insert({
      id: participant.id,
      user_id: participant.user.id,
      agenda_id: agenda.id,
      permissions: participant.permissions.join(","),
    });

    participant.roles.forEach(async (name) => {
      const roleId = (await this.getOrAddRoleId(
        name,
        agenda,
      )) as unknown as string;

      await db<ParticipantRoleRow>("participant_role").insert({
        p_id: participant.id,
        r_id: roleId,
      });
    });

    agenda.addParticipant(participant);
  }

  public async editParticipant(participant: Participant, agenda: Agenda) {
    await db<ParticipantRow>("participant")
      .update({
        permissions: participant.permissions.join(","),
      })
      .where({ id: participant.id });

    await db<ParticipantRoleRow>("participant_role")
      .delete()
      .where("p_id", participant.id);

    participant.roles.forEach(async (name) => {
      const roleId = (await this.getOrAddRoleId(
        name,
        agenda,
      )) as unknown as string;

      await db<ParticipantRoleRow>("participant_role").insert({
        p_id: participant.id,
        r_id: roleId,
      });
    });
  }

  public async removeParticipant(user: User, agenda: Agenda) {
    await db<ParticipantRow>("participant")
      .delete()
      .where({ user_id: user.id, agenda_id: agenda.id });

    agenda.removeParticipant(user);
  }

  public async getOrAddRoleId(name: string, agenda: Agenda) {
    const id = await this.getRoleId(name, agenda);
    if (!id) return this.addRole(agenda, name);
    return id;
  }

  public async getRoleId(name: string, agenda: Agenda) {
    return (
      (
        await db<RoleRow>("role")
          .select("id")
          .where({ name, agenda_id: agenda.id })
          .first()
      )?.id || null
    );
  }

  public async getRolesByAgenda(agenda: Agenda) {
    return (
      await db<RoleRow>("role").select("name").where({ agenda_id: agenda.id })
    ).map((r) => r.name);
  }

  public async addRole(agenda: Agenda, name: string) {
    const id = (
      await db<RoleRow>("role")
        .insert({ name, agenda_id: agenda.id })
        .returning("id")
    )[0]!.id;
    agenda.addRoles(name);
    return id;
  }

  public async removeRole(agenda: Agenda, name: string) {
    await db<RoleRow>("role").delete().where({ name, agenda_id: agenda.id });
    agenda.removeRole(name);
  }
}
