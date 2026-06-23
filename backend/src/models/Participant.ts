import { v4 } from "uuid";
import type User from "./User.ts";
import type { WithId } from "./WithId.ts";
import type { ParticipantRow } from "../db/types.ts";

export enum Permission {
  read,
  write,
}

export default class Participant implements WithId {
  private readonly _id: string;

  private readonly _user: User;
  private _permissions: Permission[];
  private _roles: string[];

  constructor(
    user: User,
    permissions: Permission[],
    roles: string[],
    id?: string,
  ) {
    this._id = id ?? v4();

    this._user = user;
    this._permissions = permissions;
    this._roles = roles;
  }

  get id() {
    return this._id;
  }

  get user() {
    return this._user;
  }

  get permissions() {
    return this._permissions;
  }

  addPermissions(...perms: Permission[]) {
    this._permissions.push(...perms);
  }

  removePermission(perm: Permission) {
    const permIndex = this._permissions.findIndex((v) => v === perm);

    if (permIndex != -1) this._permissions.splice(permIndex, 1);
  }

  get roles() {
    return this._roles;
  }

  addRoles(...roles: string[]) {
    this._roles.push(...roles);
  }

  removeRole(role: string) {
    const roleIndex = this._roles.findIndex((v) => v === role);

    if (roleIndex != -1) this._roles.splice(roleIndex, 1);
  }

  toJSON() {
    return {
      user: this._user.toJSON(),
      permissions: this._permissions,
      roles: this._roles,
    };
  }

  public static fromDatabase(row: ParticipantRow, roles: string[], user: User) {
    const permissions = row.permissions
      .split(",")
      .map((perm) => Permission[perm as keyof typeof Permission]);
    return new Participant(user, permissions, roles, row.id);
  }
}
