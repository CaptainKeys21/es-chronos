import type Agenda from "../models/Agenda.ts";
import type Task from "../models/Task.ts";

export default class TaskService {
  private static _instance: TaskService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new TaskService();
    }

    return this._instance;
  }

  private constructor() {}

  public createTask(task: Task, agenda: Agenda) {
    agenda.addTask(task);
  }

  public editTask(oldEvent: Task, newEvent: Task, agenda: Agenda) {
    agenda.editTask(oldEvent, newEvent);
  }

  public getTaskByName(name: string, agenda: Agenda) {
    return agenda.findTaskByName(name);
  }
}
