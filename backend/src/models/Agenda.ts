import User from "./User.ts";

class TimeZone {
  private readonly value: string;

  constructor(value: string) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
      this.value = value;
    } catch (e) {
      throw new Error(`TimeZone inválido: ${value}`);
    }
  }

  toString(): string {
    return this.value;
  }
}

export default class Agenda {
  private _owner: User;
  private readonly participants: User[] = [];

  private _name: string;
  private _timeZone: TimeZone;

  constructor(name: string, owner: User, timezone: string) {
    this._name = name;
    this._owner = owner;
    this._timeZone = new TimeZone(timezone);
  }

  get owner() {
    return this._owner;
  }

  set owner(newUser: User) {
    this._owner = newUser;
  }

  get name() {
    return this._name;
  }

  set name(newName: string) {
    this._name = newName;
  }

  get timeZone() {
    return this._timeZone.toString();
  }

  set timeZone(newTZ: string) {
    this._timeZone = new TimeZone(newTZ);
  }

  findParticipant(user: User) {
    return this.participants.find((u) => u.username === user.username) || null;
  }

  findParticipantIndex(user: User) {
    return this.participants.findIndex((u) => u.username === user.username);
  }

  addParticipant(user: User) {
    if (this.findParticipant(user)) throw "Participante já está inserido";

    this.participants.push(user);
  }

  removeParticipant(user: User) {
    if (!this.findParticipant(user)) throw "Participante não existe na lista";

    this.participants.splice(this.findParticipantIndex(user), 1);
  }

  public toJSON() {
    return {
      name: this.name,
      owner: this.owner.toJSON(),
      timezone: this.timeZone,
      participants: this.participants.map((p) => p.toJSON()),
    };
  }
}
