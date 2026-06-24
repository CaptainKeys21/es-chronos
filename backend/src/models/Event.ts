import { v4 } from "uuid";
import type { WithId } from "./WithId.ts";
import type { EventRow } from "../db/types.ts";
import { StateError } from "../errors/stateError.ts";

export const WeekDays = {
  Domingo: 0,
  Segunda: 1,
  Terca: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sabado: 6,
} as const;

export type WeekDays = (typeof WeekDays)[keyof typeof WeekDays];

export interface EventState {
  readonly status: "ORGANIZING" | "IN_PROGRESS" | "COMPLETED";

  // Ações de mutação (Edição)
  set name(name: string);
  set date(date: Date);
  set weekdays(weekdays: WeekDays[]);

  // Ações de transição de estado
  start(): void;
  complete(): void;
}

// 1. Estado: Em Organização
export class OrganizingState implements EventState {
  readonly status = "ORGANIZING";
  constructor(private event: Event) {}

  set name(name: string) {
    this.event.updateRawName(name);
  }

  set date(date: Date) {
    this.event.updateRawDate(date);
  }

  set weekdays(weekdays: WeekDays[]) {
    this.event.updateRawWeekdays(weekdays);
  }

  start(): void {
    this.event.changeState(new InProgressState(this.event));
  }

  complete(): void {
    throw new StateError(
      this.status,
      "Não é possível concluir um evento que ainda está em organização diretamente.",
    );
  }
}

// 2. Estado: Em Andamento
export class InProgressState implements EventState {
  readonly status = "IN_PROGRESS";
  constructor(private event: Event) {}

  // Bloqueia as edições neste estado
  set name(name: string) {
    throw new StateError(
      this.status,
      "Não é possível alterar o nome de um evento que já está em andamento.",
    );
  }

  set date(date: Date) {
    throw new StateError(
      this.status,
      "Não é possível alterar a data de um evento que já está em andamento.",
    );
  }

  set weekdays(weekdays: WeekDays[]) {
    throw new StateError(
      this.status,
      "Não é possível alterar os dias da semana de um evento que já está em andamento.",
    );
  }

  start(): void {
    throw new StateError(this.status, "O evento já está em andamento.");
  }

  complete(): void {
    this.event.changeState(new CompletedState(this.event));
  }
}

// 3. Estado: Concluído
export class CompletedState implements EventState {
  readonly status = "COMPLETED";
  constructor(private event: Event) {}

  // Bloqueia todas as edições e transições
  set name(name: string) {
    throw new StateError(
      this.status,
      "Não é possível alterar o nome de um evento concluído.",
    );
  }

  set date(date: Date) {
    throw new StateError(
      this.status,
      "Não é possível alterar a data de um evento concluído.",
    );
  }

  set weekdays(weekdays: WeekDays[]) {
    throw new StateError(
      this.status,
      "Não é possível alterar os dias da semana de um evento concluído.",
    );
  }

  start(): void {
    throw new StateError(
      this.status,
      "Não é possível iniciar um evento que já foi concluído.",
    );
  }

  complete(): void {
    throw new StateError(this.status, "O evento já está concluído.");
  }
}

export default class Event implements WithId {
  private _id: string;

  private _name: string;
  private _date: Date;
  private _weekdays: WeekDays[];

  private _state!: EventState;

  constructor(
    name: string,
    date: Date,
    weekdays: WeekDays[],
    initialStatus: string,
    id?: string,
  ) {
    this._id = id ?? v4();
    this._name = name;
    this._date = date;
    this._weekdays = weekdays;

    this.setInitialState(initialStatus);
  }

  private setInitialState(status?: string): void {
    switch (status) {
      case "IN_PROGRESS":
        this._state = new InProgressState(this);
        break;
      case "COMPLETED":
        this._state = new CompletedState(this);
        break;
      case "ORGANIZING":
      default:
        this._state = new OrganizingState(this);
        break;
    }
  }

  public changeState(state: EventState): void {
    this._state = state;
  }

  public updateRawName(name: string): void {
    this._name = name;
  }

  public updateRawDate(date: Date): void {
    this._date = date;
  }

  public updateRawWeekdays(weekdays: WeekDays[]): void {
    this._weekdays = weekdays;
  }

  // Métodos públicos para transição de ciclo de vida do Evento
  public start(): void {
    this._state.start();
  }

  public complete(): void {
    this._state.complete();
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  set name(newName: string) {
    this._state.name = newName;
  }

  get date() {
    return this._date;
  }

  set date(newDL: Date) {
    this._state.date = newDL;
  }

  get weekdays() {
    return this._weekdays;
  }

  set weekdays(newWeekdays: WeekDays[]) {
    this._state.weekdays = newWeekdays;
  }

  get status(): string {
    return this._state.status;
  }

  public static fromDatabase(row: EventRow) {
    const weekDays = row.weekdays.split(",").map((v) => Number(v) as WeekDays);
    return new Event(row.name, row.date, weekDays, row.status, row.id);
  }

  public toJSON() {
    return {
      name: this.name,
      date: this.date.getTime(),
      weekdays: this.weekdays,
    };
  }
}
