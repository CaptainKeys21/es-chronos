import db from "../db/index.ts";
import type { TaskRow } from "../db/types.ts";
import type Agenda from "../models/Agenda.ts";
import Task from "../models/Task.ts";
import type User from "../models/User.ts";
import UserService from "./UserService.ts";

export default class TaskService {
  private static _instance: TaskService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new TaskService();
    }

    return this._instance;
  }

  private constructor() {}

  public async createTask(task: Task, agenda: Agenda) {
    await db<TaskRow>("task").insert({
      id: task.id,
      name: task.name,
      deadline: task.deadline,
      progress: task.progress,
      agenda_id: agenda.id,
      owner_id: task.owner?.id,
    });

    agenda.addTask(task);
  }

  public async editTask(oldTask: Task, newTask: Task, agenda: Agenda) {
    await db<TaskRow>("task")
      .update({
        name: newTask.name,
        progress: newTask.progress,
        deadline: newTask.deadline,
        owner_id: newTask.owner?.id,
      })
      .where({ id: oldTask.id });
    agenda.editTask(oldTask, newTask);
  }

  public async getTasksByAgendaId(agenda_id: string): Promise<Task[]> {
    const rows = await db<TaskRow>("task").select("*").where({ agenda_id });

    const tasksPromises = rows.map(async (row) => {
      const owner = row.owner_id
        ? await UserService.instance.getUserById(row.owner_id)
        : null;

      return Task.fromDatabase(row, owner);
    });

    return Promise.all(tasksPromises);
  }

  public async getTaskByName(name: string, agenda: Agenda) {
    const taskRow = await db<TaskRow>("task")
      .select("*")
      .where({ name, agenda_id: agenda.id })
      .first();

    if (!taskRow) return null;

    const owner = taskRow.owner_id
      ? await UserService.instance.getUserById(taskRow.owner_id)
      : null;

    return Task.fromDatabase(taskRow, owner);
  }

  public async assignUser(task: Task, user: User) {
    await db<TaskRow>("task").update("owner_id", user.id).where("id", task.id);
    task.owner = user;
  }

  public async unassignUser(task: Task) {
    await db<TaskRow>("task").update("owner_id", null).where("id", task.id);
    task.owner = null;
  }
}
