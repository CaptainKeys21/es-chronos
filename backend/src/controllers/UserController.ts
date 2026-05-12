import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import UserService from "../services/UserService.ts";
import User from "../models/User.ts";

type CreateReqBody = {
  username: string;
  email: string;
  password: string;
};

type LoginReqBody = {
  username: string;
  password: string;
};

export class UserController {
  private readonly userService = UserService.instance;
  private static readonly JWT_Secret = "algo_super_secreto";

  public getByUsername = (req: Request, res: Response) => {
    const { username } = req.params;

    if (typeof username !== "string")
      return res.status(400).send("Bad Request");

    const user = this.userService.getUserByUsername(username);

    if (user === null) return res.status(404).send("Not Found");

    return res.status(200).json(user.toJSON());
  };

  public create = (req: Request<{}, {}, CreateReqBody>, res: Response) => {
    try {
      const { username, email, password } = req.body;
      const newUser = new User(username, email, password);
      this.userService.createUser(newUser);
      return res.status(201).send("Created");
    } catch (e) {
      console.error(e);

      return res.status(500).send("Internal Server Error");
    }
  };

  public loginUser = (req: Request<{}, {}, LoginReqBody>, res: Response) => {
    const { username, password } = req.body;

    const user = this.userService.getUserByUsername(username);

    if (!user) return res.status(404).send("User not Found");

    if (!user.checkPassword(password))
      return res.status(401).send("Not Authorized");

    const token = jwt.sign(user.username, UserController.JWT_Secret);

    return res.status(200).json({ token });
  };

  public static authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    // O padrão é "Bearer <TOKEN>"
    const [, token] = authHeader.split(" ");

    if (!token) return res.status(401).json({ message: "Token inválido" });

    try {
      const decoded = jwt.verify(token, this.JWT_Secret);
      // Opcional: salvar os dados do usuário no objeto req para usar depois
      (req as any).username = decoded;

      return next(); // Token ok! Pode seguir para o controller
    } catch (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };

  public static optionalAuthMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    // O padrão é "Bearer <TOKEN>"
    const [, token] = authHeader.split(" ");

    if (!token) return res.status(401).json({ message: "Token inválido" });

    try {
      const decoded = jwt.verify(token, this.JWT_Secret);
      // Opcional: salvar os dados do usuário no objeto req para usar depois
      (req as any).username = decoded;

      return next(); // Token ok! Pode seguir para o controller
    } catch (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };
}
