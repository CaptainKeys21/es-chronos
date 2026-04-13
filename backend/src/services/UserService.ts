import type User from "../models/User.ts";

export default class UserService {
  private static _instance: UserService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new UserService();
    }

    return this._instance;
  }

  // Temporário, será usado como banco de dados
  private readonly users: User[] = [];

  private constructor() {}

  public createUser(user: User) {
    this.users.push(user);
  }

  public getUserByUsername(username: string) {
    return this.users.find((u) => (u.username = username)) || null;
  }
}
