import type { NextFunction, Request, Response } from "express";
import { DatabaseError } from "pg";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof DatabaseError) {
    const mapPostgresToHTTP: Record<string, { status: number; msg: string }> = {
      "23505": { status: 409, msg: "Este registro já existe." },
      "23503": {
        status: 400,
        msg: "Operação inválida: vínculo de dados inexistente.",
      },
      "22P02": { status: 400, msg: "Formato de dados ou ID inválido enviado." },
      "23502": { status: 400, msg: "Campos obrigatórios estão ausentes." },
    };

    const mapped = mapPostgresToHTTP[error.code || ""];

    if (mapped) {
      res.status(mapped.status).json({ error: mapped.msg });
      return;
    }
  }

  res.status(500).json({ error: "Erro interno do servidor" });
};
