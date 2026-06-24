import type Task from "./Task.ts";
import type Event from "./Event.ts";
import User from "./User.ts";
import type { WithId } from "./WithId.ts";
import type { UUID } from "crypto";
import { v4 } from "uuid";
import type { AgendaRow } from "../db/types.ts";
import Participant from "./Participant.ts";
import { Permission } from "./Participant.ts";

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

export enum Visibility {
  public,
  private,
}

export default class Agenda implements WithId {
  private readonly _id: string;

  private _owner: User;
  private readonly participants: Participant[] = [];

  private _visibility: Visibility;

  private readonly tasks: Task[] = [];
  private readonly events: Event[] = [];
  private readonly roles: string[] = [];

  private _name: string;
  private _timeZone: TimeZone;

  constructor(
    name: string,
    owner: User,
    timezone: string,
    visibility: Visibility,
    id?: string,
  ) {
    this._id = id ?? v4();
    this._name = name;
    this._owner = owner;
    this._timeZone = new TimeZone(timezone);
    this._visibility = visibility;
  }

  get owner() {
    return this._owner;
  }

  set owner(newUser: User) {
    this._owner = newUser;
  }

  get id() {
    return this._id;
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

  get visibility() {
    return this._visibility;
  }

  set visibility(visibility: Visibility) {
    this._visibility = visibility;
  }

  public isUserParticipating(user: User) {
    return (
      this.isUserOwner(user) ||
      this.participants.some((u) => u.user.id === user.id)
    );
  }

  isUserOwner(user: User): boolean {
    return this.owner.id === user.id;
  }

  userCanEdit(user: User) {
    if (this.isUserOwner(user)) return true;
    if (!this.isUserParticipating(user)) return false;

    const permissions = this.getUserPermissions(user);

    if (!permissions || !permissions.includes(Permission.write)) return false;

    return true;
  }

  userCanSee(user: User | null) {
    if (this._visibility == Visibility.public) return true;
    if (!user) return;

    return this.isUserParticipating(user);
  }

  findParticipant(user: User) {
    return (
      this.participants.find((u) => u.user.username === user.username)?.user ||
      null
    );
  }

  private getUserPermissions(user: User) {
    return (
      this.participants.find((u) => u.user.username === user.username)
        ?.permissions || null
    );
  }

  findParticipantIndex(user: User) {
    return this.participants.findIndex(
      (u) => u.user.username === user.username,
    );
  }

  addParticipantByUser(user: User, permissions: Permission[]) {
    if (this.findParticipant(user)) throw "Participante já está inserido";

    this.participants.push(new Participant(user, permissions, []));
  }

  addParticipant(...participant: Participant[]) {
    participant.forEach((p) => {
      if (this.findParticipant(p.user)) throw "Participante já está inserido";

      this.participants.push(p);
    });
  }

  removeParticipant(user: User) {
    if (!this.findParticipant(user)) throw "Participante não existe na lista";

    this.participants.splice(this.findParticipantIndex(user), 1);
  }

  findTask(task: Task) {
    return this.tasks.find((t) => t.name === task.name) || null;
  }

  findTaskByName(name: string) {
    return this.tasks.find((t) => t.name === name) || null;
  }

  findTaskIndex(task: Task) {
    return this.tasks.findIndex((t) => t.name === task.name);
  }

  addTask(...task: Task[]) {
    task.forEach((t) => {
      if (this.findTask(t)) throw "Tarefa já está inserido";

      this.tasks.push(t);
    });
  }

  editTask(oldTask: Task, newTask: Task) {
    const taskIndex = this.findTaskIndex(oldTask);
    if (taskIndex === -1) throw "Evento não existe na lista";

    this.tasks.splice(taskIndex, 1, newTask);
  }

  removeTask(task: Task) {
    if (!this.findTask(task)) throw "Participante não existe na lista";

    this.tasks.splice(this.findTaskIndex(task), 1);
  }

  findEvent(event: Event) {
    return this.events.find((e) => e.name === event.name) || null;
  }

  findEventByName(name: string) {
    return this.events.find((e) => e.name === name) || null;
  }

  findEventIndex(event: Event) {
    return this.events.findIndex((e) => e.name === event.name);
  }

  addEvent(...event: Event[]) {
    event.forEach((e) => {
      if (this.findEvent(e)) throw "Tarefa já está inserido";

      this.events.push(e);
    });
  }

  editEvent(oldEvent: Event, newEvent: Event) {
    const eventIndex = this.findEventIndex(oldEvent);
    if (eventIndex === -1) throw "Evento não existe na lista";

    this.events.splice(eventIndex, 1, newEvent);
  }

  removeEvent(event: Event) {
    if (!this.findEvent(event)) throw "Evento não existe na lista";

    this.events.splice(this.findEventIndex(event), 1);
  }

  addRoles(...role: string[]) {
    this.roles.push(...role);
  }

  removeRole(role: string) {
    const roleIndex = this.roles.findIndex((v) => v === role);
    if (roleIndex === -1) throw "Cargo não existe na lista";

    this.roles.splice(roleIndex, 1);
  }

  public static fromDatabase(agendaRow: AgendaRow, user: User) {
    return new Agenda(
      agendaRow.name,
      user,
      agendaRow.timezone,
      Visibility[agendaRow.visibility as keyof typeof Visibility],
      agendaRow.id,
    );
  }

  public toJSON() {
    return {
      name: this.name,
      owner: this.owner.toJSON(),
      timezone: this.timeZone,
      participants: this.participants,
      tasks: this.tasks.map((t) => t.toJSON()),
      events: this.events.map((e) => e.toJSON()),
      roles: this.roles,
    };
  }
}
