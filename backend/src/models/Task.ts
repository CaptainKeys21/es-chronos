import { v4 } from "uuid";
import type { WithId } from "./WithId.ts";
import type { TaskRow } from "../db/types.ts";
import type User from "./User.ts";

export interface TaskState {
  readonly status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  set progress(value: number);
  get isComplete(): boolean;
}

export class TodoState implements TaskState {
  readonly status = "TODO";
  constructor(private task: Task) {}

  get isComplete(): boolean {
    return false;
  }

  set progress(value: number) {
    this.task.rawProgress = value;

    if (value === 100) {
      this.task.state = new CompletedState(this.task);
    } else if (value > 0) {
      this.task.state = new InProgressState(this.task);
    }
  }
}

export class InProgressState implements TaskState {
  readonly status = "IN_PROGRESS";
  constructor(private task: Task) {}

  get isComplete(): boolean {
    return false;
  }

  set progress(value: number) {
    this.task.rawProgress = value;

    if (value === 100) {
      this.task.state = new CompletedState(this.task);
    } else if (value === 0) {
      this.task.state = new TodoState(this.task);
    }
  }
}

export class CompletedState implements TaskState {
  readonly status = "COMPLETED";
  constructor(private task: Task) {}

  get isComplete(): boolean {
    return true;
  }

  set progress(value: number) {
    throw new Error("Tarefa completa não pode ter seu progresso modificado");
  }
}

class ProgressBar {
  private _value: number = 0;

  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }

  set value(newValue: number) {
    // Garante o "clamping" (limita entre 0 e 100)
    this._value = Math.max(0, Math.min(100, newValue));
  }

  get value(): number {
    return this._value;
  }

  get isComplete(): boolean {
    return this._value === 100;
  }
}

export default class Task implements WithId {
  private readonly _id: string;

  private _owner: User | null;

  private _name: string;
  private _deadline: Date;
  private readonly _progress: ProgressBar;

  private _state!: TaskState;

  constructor(
    name: string,
    deadline: Date,
    progress: number,
    owner: User | null,
    id?: string,
  ) {
    this._id = id ?? v4();
    this._name = name;
    this._deadline = deadline;
    this._progress = new ProgressBar(progress);
    this._owner = owner;

    this.setInitialState(progress);
  }

  private setInitialState(progress: number) {
    if (progress === 100) {
      this._state = new CompletedState(this);
    } else if (progress === 0) {
      this._state = new TodoState(this);
    } else {
      this._state = new InProgressState(this);
    }
  }

  set rawProgress(value: number) {
    this._progress.value = value;
  }

  set state(state: TaskState) {
    this._state = state;
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

  get deadline() {
    return this._deadline;
  }

  set deadline(newDL: Date) {
    this._deadline = newDL;
  }

  get progress() {
    return this._progress.value;
  }

  set progress(newPercentage: number) {
    this._state.progress = newPercentage;
  }

  get isComplete() {
    return this._state.isComplete;
  }

  set owner(user: User | null) {
    this._owner = user;
  }

  get owner() {
    return this._owner;
  }

  get status() {
    return this._state.status;
  }

  public isOwner(user: User) {
    return this._owner?.id === user.id;
  }

  public static fromDatabase(row: TaskRow, owner: User | null) {
    return new Task(row.name, row.deadline, row.progress, owner, row.id);
  }

  public toJSON() {
    return {
      name: this.name,
      deadline: this.deadline.getTime(),
      progress: this.progress,
      status: this.status,
      isComplete: this.isComplete,
      owner: this.owner?.toJSON(),
    };
  }
}
