import bcrypt from "bcrypt";

export default class User {
  private readonly saltRounds = 10;

  private _username: string;
  private _email: string;
  private pwd_hash: string;

  constructor(username: string, email: string, password: string) {
    this._username = username;
    this._email = email;
    this.pwd_hash = bcrypt.hashSync(password, this.saltRounds);
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

  public checkPassword(pwd: string) {
    return bcrypt.compareSync(pwd, this.pwd_hash);
  }

  public toJSON() {
    return {
      username: this.username,
      email: this.email,
    };
  }
}
