import type Task from "./Task.ts";
import type Event from "./Event.ts";
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

  private readonly tasks: Task[] = [];
  private readonly events: Event[] = [];

  private _name: string;
  private _timeZone: TimeZone;

  constructor(
    name: string,
    owner: User,
    timezone: string,
    participants?: User[],
  ) {
    this._name = name;
    this._owner = owner;
    this._timeZone = new TimeZone(timezone);
    console.log({ participants });
    if (participants) {
      participants.forEach((p) => this.addParticipant(p));
    }
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

  userCanEdit(user: User) {
    return (
      this.owner.username === user.username ||
      this.participants.some((u) => u.username === user.username)
    );
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

  findTask(task: Task) {
    return this.tasks.find((t) => t.name === task.name) || null;
  }

  findTaskByName(name: string) {
    return this.tasks.find((t) => t.name === name) || null;
  }

  findTaskIndex(task: Task) {
    return this.tasks.findIndex((t) => t.name === task.name);
  }

  addTask(task: Task) {
    if (this.findTask(task)) throw "Tarefa já está inserido";

    this.tasks.push(task);
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

  addEvent(event: Event) {
    if (this.findEvent(event)) throw "Tarefa já está inserido";

    this.events.push(event);
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

  public toJSON() {
    return {
      name: this.name,
      owner: this.owner.toJSON(),
      timezone: this.timeZone,
      participants: this.participants.map((p) => p.toJSON()),
      tasks: this.tasks.map((t) => t.toJSON()),
      events: this.events.map((e) => e.toJSON()),
    };
  }
}
