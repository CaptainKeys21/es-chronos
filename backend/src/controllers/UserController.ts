import type { Request, Response } from "express";
import UserService from "../services/UserService.ts";
import User from "../models/User.ts";

type CreateReqBody = {
  username: string;
  email: string;
  password: string;
};

export class UserController {
  private readonly userService = UserService.instance;

  public getByUsername = (req: Request, res: Response) => {
    const { username } = req.params;

    if (typeof username !== "string")
      return res.status(400).send("Bad Request");

    const user = this.userService.getUserByUsername(username);

    if (user === null) return res.status(404).send("Not Found");

    return res.status(200).json(user.toJSON());
  };

  public create = (req: Request<{}, {}, CreateReqBody>, res: Response) => {
    const { username, email, password } = req.body;

    const newUser = new User(username, email, password);

    this.userService.createUser(newUser);
  };
}
