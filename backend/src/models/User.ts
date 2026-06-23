import bcrypt from "bcrypt";
import type { UserRow } from "../db/types.ts";
import type { WithId } from "./WithId.ts";
import { v4 } from "uuid";

export default class User implements WithId {
  private readonly saltRounds = 10;

  private readonly _id: string;

  private _username: string;
  private _email: string;
  private pwd_hash: string;

  constructor(
    username: string,
    email: string,
    password: { value: string; notHash?: boolean },
    id?: string,
  ) {
    this._id = id ?? v4();
    this._username = username;
    this._email = email;
    this.pwd_hash = password.notHash
      ? password.value
      : bcrypt.hashSync(password.value, this.saltRounds);
  }

  public get id() {
    return this._id;
  }

  public set username(newUsername: string) {
    this._username = newUsername;
  }

  public get username() {
    return this._username;
  }

  public set email(newEmail: string) {
    this._email = newEmail;
  }

  public get email() {
    return this._email;
  }

  public set password(newPwd: string) {
    this.pwd_hash = bcrypt.hashSync(newPwd, this.saltRounds);
  }

  public set password_hash(hash: string) {
    this.pwd_hash = hash;
  }

  public get password() {
    return this.pwd_hash;
  }

  public checkPassword(pwd: string) {
    return bcrypt.compareSync(pwd, this.pwd_hash);
  }

  public static fromDatabase(row: UserRow) {
    return new User(
      row.username,
      row.email,
      { value: row.pwd_hash, notHash: true },
      row.id,
    );
  }

  public toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password: this.pwd_hash,
    };
  }
}
