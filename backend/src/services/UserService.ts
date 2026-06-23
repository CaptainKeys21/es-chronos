import type { Knex } from "knex";
import db from "../db/index.ts";
import User from "../models/User.ts";
import type { UserRow } from "../db/types.ts";

export default class UserService {
  private static _instance: UserService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new UserService();
    }

    return this._instance;
  }

  private constructor() {}

  public async createUser(user: User) {
    return await db<UserRow>("user").insert({
      id: user.id,
      username: user.username,
      email: user.email,
      pwd_hash: user.password,
    });
  }

  public async getUserByUsername(username: string) {
    const res = await db<UserRow>("user")
      .select("*")
      .where({ username })
      .first();

    if (!res) return null;

    return User.fromDatabase(res);
  }

  public async getUserById(id: string) {
    const res = await db<UserRow>("user").select("*").where({ id }).first();

    if (!res) return null;

    return User.fromDatabase(res);
  }

  public async getUsersByIds(ids: string[]) {
    return (await db<UserRow>("user").select("*").whereIn("id", ids)).map((u) =>
      User.fromDatabase(u),
    );
  }
}
