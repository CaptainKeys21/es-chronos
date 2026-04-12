import type User from "../models/User.ts";

export default class UserService {
  private static _instance: UserService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new UserService();
    }

    return this._instance;
  }

  private readonly users: User[] = [];

  private constructor() {}

  public createUser(user: User) {
    this.users.push(user);
  }
}
