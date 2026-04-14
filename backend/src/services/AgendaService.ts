import type Agenda from "../models/Agenda.ts";
import type User from "../models/User.ts";

export default class AgendaService {
  private static _instance: AgendaService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new AgendaService();
    }

    return this._instance;
  }

  // Temporário, será usado como banco de dados
  private readonly agendas: Agenda[] = [];

  private constructor() {}

  public createAgenda(agenda: Agenda) {
    this.agendas.push(agenda);
  }

  public editAgenda(agenda: Agenda, newName: string, newTZ: string) {
    agenda.name = newName;
    agenda.timeZone = newTZ;
  }

  public getAgendaByName(name: string) {
    return this.agendas.find((u) => u.name === name) || null;
  }

  public getAgendaByUsername(user: User) {
    return this.agendas.find(
      (a) => a.owner.username === user.username || a.findParticipant(user),
    );
  }
}
